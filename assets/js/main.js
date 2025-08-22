
const walletInput = document.getElementById('walletInput');
const checkBtn = document.getElementById('checkBtn');
const spinner = document.getElementById('spinner');
const btnText = document.getElementById('btnText');
const results = document.getElementById('results');
const notEligible = document.getElementById('notEligible');
const totalTokens = document.getElementById('totalTokens');
const campaignsList = document.getElementById('campaignsList');
const errorMessage = document.getElementById('errorMessage');
const connectBtn = document.getElementById('connectBtn');

let airdropData = null;
let connectedAccount = null;

async function loadAirdropData() {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        airdropData = await response.json();
    } catch (error) {
        console.error('Failed to load airdrop data:', error);
        showError('Could not load eligibility data. Please try again later.');
    }
}

function isValidWallet(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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

function updateUIWithAccount(account) {
    connectedAccount = account;
    walletInput.value = account;
    const truncatedAddress = `${account.substring(0, 5)}...${account.substring(account.length - 4)}`;
    connectBtn.textContent = truncatedAddress;
    hideMessages();
}

function disconnect() {
    connectedAccount = null;
    walletInput.value = '';
    connectBtn.textContent = 'Connect Wallet';
    hideMessages();
}

async function connectWallet() {
    if (connectedAccount) {
        disconnect();
        return;
    }

    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                updateUIWithAccount(accounts[0]);
            }
        } catch (error) {
            console.error("User rejected the connection request:", error);
            showError('Connection request rejected.');
        }
    } else {
        alert('Please install a wallet like MetaMask to use this feature.');
    }
}

function showResults(data) {
    if (data && data.total > 0) {
        totalTokens.textContent = data.total.toLocaleString();
        campaignsList.innerHTML = data.campaigns.map(campaign => `
                    <div class="campaign-item">
                        <div class="campaign-name">${campaign.name}</div>
                        <div class="campaign-tokens">
                           ${campaign.tokens.toLocaleString()}
                           <img src="token.png" alt="Token" class="token-icon">
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
    const address = walletInput.value.trim().toLowerCase();

    if (!address) {
        showError('Please enter a wallet address.');
        return;
    }

    if (!isValidWallet(address)) {
        showError('Please enter a VALID wallet address.');
        return;
    }

    if (!airdropData) {
        showError('Data is still loading, please wait a moment and try again.');
        return;
    }

    checkBtn.disabled = true;
    spinner.style.display = 'block';
    btnText.textContent = 'Checking...';

    try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        const data = airdropData[address];
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

if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0 && connectedAccount) {
            updateUIWithAccount(accounts[0]);
        } else {
            disconnect();
        }
    });
}

checkBtn.addEventListener('click', checkAllocation);
connectBtn.addEventListener('click', connectWallet);
walletInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAllocation();
});

walletInput.addEventListener('input', () => {
    hideMessages();
    if (connectedAccount && walletInput.value.toLowerCase() !== connectedAccount.toLowerCase()) {
        disconnect();
    }
});

connectBtn.addEventListener('mouseover', () => {
    if (connectedAccount) {
        connectBtn.textContent = 'Disconnect';
    }
});

connectBtn.addEventListener('mouseout', () => {
    if (connectedAccount) {
        // *** LA CORREZIONE È QUI ***
        const truncatedAddress = `${connectedAccount.substring(0, 5)}...${connectedAccount.substring(connectedAccount.length - 4)}`;
        connectBtn.textContent = truncatedAddress;
    }
});

window.addEventListener('load', () => {
    loadAirdropData();
    walletInput.focus();
});