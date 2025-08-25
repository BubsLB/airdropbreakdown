const walletInput = document.getElementById('walletInput');
const checkBtn = document.getElementById('checkBtn');
const spinner = document.getElementById('spinner');
const btnText = document.getElementById('btnText');
const results = document.getElementById('results');
const notEligible = document.getElementById('notEligible');
const totalTokens = document.getElementById('totalTokens');
const campaignsList = document.getElementById('campaignsList');
const errorMessage = document.getElementById('errorMessage');

let addressMap = null;
let airdropData = null;

async function loadAirdropData() {
    try {
        const [mapResponse, dataResponse] = await Promise.all([
            fetch('/address_map.json'),
            fetch('/airdrop_data.json')
        ]);
        if (!mapResponse.ok || !dataResponse.ok) {
            throw new Error('Network response was not ok');
        }
        addressMap = await mapResponse.json();
        airdropData = await dataResponse.json();
    } catch (error) {
        console.error('Failed to load airdrop data:', error);
        showError('Could not load eligibility data. Please try again later.');
    }
}

function isEvmAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/i.test(address);
}

function isAlgorandAddress(address) {
    return /^[A-Z2-7]{58}$/.test(address.toUpperCase());
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    results.classList.remove('show');
    notEligible.classList.remove('show');
}

function showResults(data) {
    if (data && data.total > 0) {
        totalTokens.textContent = data.total.toLocaleString();
        campaignsList.innerHTML = data.campaigns.map(campaign => `
            <div class="campaign-item">
                <div class="campaign-name">${campaign.name}</div>
                <div class="campaign-tokens">
                   ${campaign.tokens.toLocaleString()}
                   <img src="assets/images/token.png" alt="Token" class="token-icon">
                </div>
            </div>
        `).join('');
        results.classList.add('show');
    } else {
        notEligible.classList.add('show');
    }
}

async function checkAllocation() {
    hideMessages();
    const address = walletInput.value.trim();
    const lookupAddress = address.toLowerCase();
    let data = null;

    if (!address) {
        showError('Please enter a wallet address.');
        return;
    }

    if (!addressMap || !airdropData) {
         showError('Data is still loading, please wait a moment and try again.');
         return;
    }

    checkBtn.disabled = true;
    spinner.style.display = 'block';
    btnText.textContent = 'Checking...';

    try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // --- NUOVA LOGICA CONDIZIONALE ---
        if (isEvmAddress(address)) {
            // Se è EVM, usa la mappa per trovare l'accountID
            const accountId = addressMap[lookupAddress];
            if (accountId) {
                data = airdropData[accountId.toLowerCase()];
            }
        } else if (isAlgorandAddress(address)) {
            // Se è Algorand, cerca direttamente nei dati dell'airdrop
            data = airdropData[lookupAddress];
        } else {
            // Se non è nessuno dei due, mostra errore senza cercare
            showError('Please enter a valid EVM or Algorand wallet address.');
            // Ripristina il pulsante e esci
            checkBtn.disabled = false;
            spinner.style.display = 'none';
            btnText.textContent = 'Check';
            return;
        }
        // ------------------------------------

        showResults(data);
    } catch (error) {
        console.error("Error during checkAllocation:", error);
        showError('An unexpected error occurred. Please try again.');
    } finally {
        checkBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Check';
    }
}

checkBtn.addEventListener('click', checkAllocation);

walletInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAllocation();
    }
});

walletInput.addEventListener('input', hideMessages);

window.addEventListener('load', () => {
    loadAirdropData();
    walletInput.focus();
});