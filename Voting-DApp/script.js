/**
 * ==============================================================================
 * Decentralized Voting System - Frontend Application Logic
 * ==============================================================================
 * Blockchain Technology Lab Assignment
 *
 * Network:     Sepolia Ethereum Testnet (Chain ID: 11155111 / 0xaa36a7)
 * Contract:    0x1aE68E26A44b691200A2743b6bF7706CC1c2039c
 * Framework:   Vanilla JavaScript + ethers.js v6
 * ==============================================================================
 */

'use strict';

// ==============================================================================
// 1. Configuration & Smart Contract Specification
// ==============================================================================

const CONTRACT_ADDRESS = '0x1aE68E26A44b691200A2743b6bF7706CC1c2039c';
const SEPOLIA_CHAIN_ID_DEC = 11155111;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
const SEPOLIA_RPC_FALLBACK = 'https://ethereum-sepolia-rpc.publicnode.com';

/**
 * Smart Contract Application Binary Interface (ABI)
 * Exact interface matching the deployed Voting.sol contract on Sepolia.
 */
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "candidateName",
        "type": "string"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getAllCandidates",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "voteCount",
            "type": "uint256"
          }
        ],
        "internalType": "struct Voting.Candidate[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      }
    ],
    "name": "getCandidate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCandidateCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ==============================================================================
// 2. Global Application State
// ==============================================================================

const state = {
  currentAccount: null,       // Connected MetaMask address
  currentChainId: null,       // Active network chain ID
  isSepolia: false,           // Boolean flag if network is Sepolia
  hasVoted: false,            // Whether connected address has cast a vote
  candidates: [],             // Array of candidate objects from contract
  candidateCount: 0,          // Total candidates count
  totalVotes: 0,              // Aggregated vote count
  leaderName: 'No votes yet', // Current leading candidate
  isConnecting: false,        // Prevents multiple connection requests
  isVotingInProgress: false,  // Prevents duplicate vote transactions
  votingCandidateId: null,    // Currently submitting candidate ID
  provider: null,             // ethers.BrowserProvider instance
  signer: null,               // ethers Signer instance
  contract: null,             // ethers.Contract with signer
  readOnlyContract: null      // ethers.Contract with read-only provider
};

// ==============================================================================
// 3. DOM Elements Cache
// ==============================================================================

const DOM = {
  networkPill: document.getElementById('networkPill'),
  networkName: document.getElementById('networkName'),
  switchNetworkBtn: document.getElementById('switchNetworkBtn'),
  connectWalletBtn: document.getElementById('connectWalletBtn'),
  accountInfo: document.getElementById('accountInfo'),
  accountAddress: document.getElementById('accountAddress'),
  copyAddressBtn: document.getElementById('copyAddressBtn'),
  voterStatusCard: document.getElementById('voterStatusCard'),
  statusIcon: document.getElementById('statusIcon'),
  statusTitle: document.getElementById('statusTitle'),
  statusMessage: document.getElementById('statusMessage'),
  statCandidateCount: document.getElementById('statCandidateCount'),
  statTotalVotes: document.getElementById('statTotalVotes'),
  statLeader: document.getElementById('statLeader'),
  statVoterStatusBadge: document.getElementById('statVoterStatusBadge'),
  candidatesGrid: document.getElementById('candidatesGrid'),
  refreshBtn: document.getElementById('refreshBtn'),
  txTrackerSection: document.getElementById('txTrackerSection'),
  txStatusTitle: document.getElementById('txStatusTitle'),
  txStatusDesc: document.getElementById('txStatusDesc'),
  txHashLink: document.getElementById('txHashLink'),
  txHashShort: document.getElementById('txHashShort'),
  toastContainer: document.getElementById('toastContainer')
};

// ==============================================================================
// 4. Application Initialization
// ==============================================================================

window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing Decentralized Voting DApp with ethers.js v6...');

  // Verify ethers.js v6 library availability
  if (typeof ethers === 'undefined') {
    showToast('Failed to load ethers.js v6 library. Please check your internet connection.', 'error');
    return;
  }

  // Register interactive DOM listeners
  setupDOMEventListeners();

  // Setup MetaMask event listeners if installed
  if (isMetaMaskInstalled()) {
    setupMetaMaskListeners();

    // Check if user already authorized accounts previously
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        await handleAccountsChanged(accounts);
      } else {
        await checkNetwork();
      }
    } catch (err) {
      console.warn('Silent account query error:', err);
      await checkNetwork();
    }
  } else {
    updateNetworkUI(false, 'MetaMask Not Installed');
    updateVoterStatusUI();
    showToast('MetaMask is not installed. Please install MetaMask to interact with this DApp.', 'warning');
  }

  // Initial fetch of candidates and results from smart contract
  await loadContractData();
});

/**
 * Register button click listeners and event bindings
 */
function setupDOMEventListeners() {
  DOM.connectWalletBtn.addEventListener('click', connectWallet);
  DOM.switchNetworkBtn.addEventListener('click', switchToSepolia);
  DOM.refreshBtn.addEventListener('click', async () => {
    DOM.refreshBtn.disabled = true;
    showToast('Refreshing candidate data from smart contract...', 'info');
    await loadContractData();
    if (state.currentAccount) {
      await checkVoterStatus();
    }
    setTimeout(() => { DOM.refreshBtn.disabled = false; }, 800);
  });

  DOM.copyAddressBtn.addEventListener('click', () => {
    if (state.currentAccount) {
      navigator.clipboard.writeText(state.currentAccount)
        .then(() => showToast('Wallet address copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy address.', 'error'));
    }
  });
}

// ==============================================================================
// 5. MetaMask & Provider Utilities
// ==============================================================================

/**
 * Check if MetaMask Ethereum provider is present in the browser window
 */
function isMetaMaskInstalled() {
  return typeof window.ethereum !== 'undefined' && Boolean(window.ethereum.isMetaMask);
}

/**
 * Setup MetaMask real-time event listeners for account and network changes
 */
function setupMetaMaskListeners() {
  if (!window.ethereum) return;

  // Listen for account switching or disconnection in MetaMask
  window.ethereum.on('accountsChanged', (accounts) => {
    console.log('🔄 MetaMask accountsChanged:', accounts);
    handleAccountsChanged(accounts);
  });

  // Listen for chain/network switching
  window.ethereum.on('chainChanged', (chainId) => {
    console.log('🔄 MetaMask chainChanged:', chainId);
    handleChainChanged(chainId);
  });
}

/**
 * Connect the user's MetaMask wallet using eth_requestAccounts
 */
async function connectWallet() {
  if (!isMetaMaskInstalled()) {
    showToast('MetaMask is not installed. Please install MetaMask extension to continue.', 'error');
    window.open('https://metamask.io/download/', '_blank');
    return;
  }

  if (state.isConnecting) return;

  try {
    state.isConnecting = true;
    DOM.connectWalletBtn.disabled = true;
    DOM.connectWalletBtn.innerHTML = `
      <span class="status-dot" style="background:#fbbf24; animation: pulse 1s infinite;"></span>
      Connecting...
    `;

    // Request accounts from MetaMask
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    if (accounts && accounts.length > 0) {
      await handleAccountsChanged(accounts);
      showToast('Wallet connected successfully!', 'success');
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
    if (error.code === 4001) {
      showToast('Connection request was rejected in MetaMask.', 'warning');
    } else {
      showToast('Wallet connection failed: ' + (error.message || error), 'error');
    }
  } finally {
    state.isConnecting = false;
    updateWalletUI();
  }
}

/**
 * Handle account changes and update provider & signer (ethers.js v6)
 */
async function handleAccountsChanged(accounts) {
  if (!accounts || accounts.length === 0) {
    // User disconnected wallet in MetaMask
    state.currentAccount = null;
    state.signer = null;
    state.contract = null;
    state.hasVoted = false;
    updateWalletUI();
    updateVoterStatusUI();
    renderCandidates();
    return;
  }

  state.currentAccount = accounts[0];

  // Initialize ethers.js v6 BrowserProvider
  state.provider = new ethers.BrowserProvider(window.ethereum);

  try {
    state.signer = await state.provider.getSigner();
    state.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, state.signer);

    // Setup contract event listener for on-chain events
    setupContractEventListener();
  } catch (err) {
    console.warn('Signer acquisition note:', err);
  }

  // Verify network and voter status
  await checkNetwork();
  await checkVoterStatus();
  await loadContractData();
  updateWalletUI();
}

/**
 * Handle network/chain change event
 */
async function handleChainChanged(chainIdHex) {
  const chainId = parseInt(chainIdHex, 16);
  state.currentChainId = chainId;
  state.isSepolia = (chainId === SEPOLIA_CHAIN_ID_DEC);

  if (state.isSepolia) {
    updateNetworkUI(true, 'Sepolia (11155111)');
    showToast('Connected to Sepolia Testnet!', 'success');
  } else {
    updateNetworkUI(false, `Wrong Network (${chainId})`);
    showToast('Wrong network! Please switch to Sepolia testnet to vote.', 'warning');
  }

  // Re-initialize provider with new chain state
  if (window.ethereum) {
    state.provider = new ethers.BrowserProvider(window.ethereum);
    if (state.currentAccount) {
      try {
        state.signer = await state.provider.getSigner();
        state.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, state.signer);
        setupContractEventListener();
        await checkVoterStatus();
      } catch (err) {
        console.warn('Re-init signer note:', err);
      }
    }
    await loadContractData();
  }
}

/**
 * Detect current network chain ID and update UI
 */
async function checkNetwork() {
  if (!window.ethereum) {
    updateNetworkUI(false, 'MetaMask Not Installed');
    return false;
  }

  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);
    state.currentChainId = chainId;
    state.isSepolia = (chainId === SEPOLIA_CHAIN_ID_DEC);

    if (state.isSepolia) {
      updateNetworkUI(true, 'Sepolia (11155111)');
    } else {
      updateNetworkUI(false, `Wrong Network (${chainId})`);
    }

    updateVoterStatusUI();
    return state.isSepolia;
  } catch (err) {
    console.error('Network detection error:', err);
    updateNetworkUI(false, 'Network Error');
    return false;
  }
}

/**
 * Request MetaMask to switch to the Sepolia Testnet
 */
async function switchToSepolia() {
  if (!window.ethereum) {
    showToast('MetaMask is not installed.', 'error');
    return;
  }

  try {
    DOM.switchNetworkBtn.disabled = true;
    showToast('Requesting network switch to Sepolia in MetaMask...', 'info');

    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });

    showToast('Switched to Sepolia Testnet successfully!', 'success');
  } catch (error) {
    // Error code 4902 indicates that Sepolia has not been added to MetaMask
    if (error.code === 4902 || error?.data?.originalError?.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [
                'https://rpc.sepolia.org',
                'https://ethereum-sepolia-rpc.publicnode.com'
              ],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
        showToast('Sepolia network added and switched!', 'success');
      } catch (addError) {
        console.error('Failed to add Sepolia network:', addError);
        showToast('Failed to add Sepolia network: ' + (addError.message || addError), 'error');
      }
    } else if (error.code === 4001) {
      showToast('Network switch was cancelled in MetaMask.', 'warning');
    } else {
      console.error('Network switch failed:', error);
      showToast('Failed to switch network: ' + (error.message || error), 'error');
    }
  } finally {
    DOM.switchNetworkBtn.disabled = false;
  }
}

// ==============================================================================
// 6. Smart Contract Interaction
// ==============================================================================

/**
 * Obtain a reliable read-only contract instance
 */
async function getReadContract() {
  if (state.contract) return state.contract;

  if (window.ethereum) {
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, browserProvider);
    } catch (e) {
      console.warn('BrowserProvider read fallback error:', e);
    }
  }

  // Fallback to public Sepolia JSON-RPC
  try {
    const jsonRpc = new ethers.JsonRpcProvider(SEPOLIA_RPC_FALLBACK);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, jsonRpc);
  } catch (e) {
    console.warn('JsonRpcProvider fallback error:', e);
  }

  return null;
}

/**
 * Load candidates and results directly from the smart contract
 */
async function loadContractData() {
  try {
    const contract = await getReadContract();
    if (!contract) {
      console.warn('No contract instance available to fetch candidate data.');
      return;
    }

    // Call getAllCandidates() and getCandidateCount() in parallel
    const [rawCandidates, countRaw] = await Promise.all([
      contract.getAllCandidates(),
      contract.getCandidateCount()
    ]);

    const count = Number(countRaw);

    // Ethers v6 BigInt unpacking for candidate struct tuples
    const candidates = rawCandidates.map((cand) => ({
      id: Number(cand.id !== undefined ? cand.id : cand[0]),
      name: String(cand.name !== undefined ? cand.name : cand[1]),
      voteCount: Number(cand.voteCount !== undefined ? cand.voteCount : cand[2])
    }));

    state.candidates = candidates;
    state.candidateCount = count;

    // Calculate aggregated total votes
    state.totalVotes = candidates.reduce((acc, curr) => acc + curr.voteCount, 0);

    // Calculate leader(s)
    let maxVotes = 0;
    let leaders = [];
    if (state.totalVotes > 0) {
      candidates.forEach((c) => {
        if (c.voteCount > maxVotes) {
          maxVotes = c.voteCount;
          leaders = [c.name];
        } else if (c.voteCount === maxVotes && maxVotes > 0) {
          leaders.push(c.name);
        }
      });
    }

    state.leaderName = leaders.length > 0 ? leaders.join(' & ') : 'No votes yet';

    // Update DOM statistics and candidate cards
    updateStatsUI();
    renderCandidates();

  } catch (error) {
    console.error('Error fetching data from smart contract:', error);
    // Only alert if we don't already have rendered candidates
    if (state.candidates.length === 0) {
      showToast('Could not query Sepolia smart contract. Please check your network.', 'error');
    }
  }
}

/**
 * Check if the currently connected wallet address has already voted
 */
async function checkVoterStatus() {
  if (!state.currentAccount) {
    state.hasVoted = false;
    updateVoterStatusUI();
    renderCandidates();
    return;
  }

  try {
    const contract = await getReadContract();
    if (!contract) return;

    // Call hasVoted(address voter)
    const voted = await contract.hasVoted(state.currentAccount);
    state.hasVoted = Boolean(voted);

    console.log(`[Smart Contract] hasVoted(${state.currentAccount}):`, state.hasVoted);
    updateVoterStatusUI();
    renderCandidates();

  } catch (error) {
    console.error('Error querying hasVoted:', error);
  }
}

/**
 * Cast a vote for a candidate by submitting a transaction to Sepolia
 * @param {number} candidateId - ID of candidate (1-based: 1, 2, 3)
 * @param {string} candidateName - Display name of candidate
 */
async function handleVote(candidateId, candidateName) {
  // Pre-condition 1: Check MetaMask installation
  if (!isMetaMaskInstalled()) {
    showToast('MetaMask is required to submit a vote. Please install MetaMask.', 'error');
    window.open('https://metamask.io/download/', '_blank');
    return;
  }

  // Pre-condition 2: Check wallet connection
  if (!state.currentAccount) {
    showToast('Please connect your MetaMask wallet first.', 'warning');
    await connectWallet();
    if (!state.currentAccount) return;
  }

  // Pre-condition 3: Check network is Sepolia
  const onSepolia = await checkNetwork();
  if (!onSepolia) {
    showToast('You must be connected to the Sepolia Testnet to vote.', 'warning');
    await switchToSepolia();
    return;
  }

  // Pre-condition 4: Check if already voted
  if (state.hasVoted) {
    showToast('You have already cast your vote! Each wallet address is only allowed one vote.', 'warning');
    return;
  }

  // Pre-condition 5: Prevent duplicate submissions while pending
  if (state.isVotingInProgress) {
    showToast('A voting transaction is currently being processed. Please wait.', 'warning');
    return;
  }

  // Re-verify on-chain status before broadcasting transaction
  try {
    const doubleCheck = await state.contract.hasVoted(state.currentAccount);
    if (doubleCheck) {
      state.hasVoted = true;
      updateVoterStatusUI();
      renderCandidates();
      showToast('Smart contract verification: Your address has already voted.', 'warning');
      return;
    }
  } catch (e) {
    console.warn('Pre-vote hasVoted check skipped:', e);
  }

  // Begin Voting Transaction Flow
  try {
    state.isVotingInProgress = true;
    state.votingCandidateId = candidateId;
    renderCandidates(); // Update buttons to show loading state

    showTxTracker(
      true,
      'Awaiting MetaMask Confirmation',
      `Please review and sign the transaction for ${candidateName} in your MetaMask extension...`,
      null
    );

    showToast(`Requesting signature for ${candidateName} (Candidate #${candidateId}). Check MetaMask.`, 'info');

    // Submit transaction: vote(uint256 candidateId)
    const tx = await state.contract.vote(candidateId);

    console.log('✅ Transaction submitted to Sepolia mempool! Hash:', tx.hash);
    const explorerUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;

    showTxTracker(
      true,
      'Transaction Pending On-Chain',
      'Transaction broadcasted to Sepolia network. Awaiting block confirmation...',
      tx.hash
    );

    showToast(
      'Transaction broadcasted! Waiting for block confirmation on Sepolia...',
      'info',
      explorerUrl,
      'View on Sepolia Etherscan'
    );

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log(`🎉 Transaction mined in block #${receipt.blockNumber}!`);
      state.hasVoted = true;

      showTxTracker(
        false,
        'Vote Successfully Recorded!',
        `Your vote for ${candidateName} was confirmed in Sepolia block #${receipt.blockNumber}.`,
        tx.hash
      );

      showToast(
        `🎉 Success! Your vote for ${candidateName} is permanently recorded on-chain (Block #${receipt.blockNumber})!`,
        'success',
        explorerUrl,
        'Verify on Sepolia Etherscan'
      );

      // Refresh candidate votes & voter status
      await loadContractData();
      await checkVoterStatus();
    } else {
      throw new Error('Transaction execution reverted on Sepolia.');
    }

  } catch (error) {
    console.error('Voting transaction failed:', error);
    hideTxTracker();

    let friendlyMsg = 'Transaction failed. Please try again.';

    // Granular error diagnostics
    if (error.code === 'ACTION_REJECTED' || error.code === 4001 || error.message?.includes('user rejected') || error.message?.includes('User denied')) {
      friendlyMsg = 'Transaction was rejected in MetaMask.';
      showToast(friendlyMsg, 'warning');
    } else if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
      friendlyMsg = 'Insufficient Sepolia ETH for gas. Please get free testnet ETH from a Sepolia faucet.';
      showToast(friendlyMsg, 'error', 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia', 'Open Sepolia Faucet');
    } else if (error.message?.includes('You have already voted') || error.data?.message?.includes('You have already voted')) {
      friendlyMsg = 'Smart contract rejected: This wallet address has already cast a vote.';
      state.hasVoted = true;
      updateVoterStatusUI();
      showToast(friendlyMsg, 'error');
    } else if (error.message?.includes('Invalid candidate ID')) {
      friendlyMsg = 'Invalid candidate ID provided to the contract.';
      showToast(friendlyMsg, 'error');
    } else if (!navigator.onLine) {
      friendlyMsg = 'Network offline. Please check your internet connection.';
      showToast(friendlyMsg, 'error');
    } else {
      friendlyMsg = error.reason || error.shortMessage || error.message || 'Transaction reverted.';
      showToast('Voting error: ' + friendlyMsg, 'error');
    }

  } finally {
    state.isVotingInProgress = false;
    state.votingCandidateId = null;
    renderCandidates();
  }
}

/**
 * Setup listener for the VoteCast smart contract event
 * event VoteCast(address indexed voter, uint256 indexed candidateId, string candidateName)
 */
function setupContractEventListener() {
  if (!state.contract) return;

  try {
    // Remove existing listener to prevent duplicate firings
    state.contract.removeAllListeners('VoteCast');

    state.contract.on('VoteCast', (voter, candidateId, candidateName, event) => {
      console.log(`📡 [VoteCast Event] Voter: ${voter}, Candidate: #${candidateId} (${candidateName})`);

      showToast(
        `On-Chain Event: A new vote was cast for ${candidateName} (#${candidateId})!`,
        'info'
      );

      // Refresh candidates tally
      loadContractData();

      // If connected user was the voter, re-verify status
      if (state.currentAccount && voter.toLowerCase() === state.currentAccount.toLowerCase()) {
        checkVoterStatus();
      }
    });

    console.log('📡 Smart contract VoteCast event listener registered.');
  } catch (err) {
    console.warn('Event listener registration warning:', err);
  }
}

// ==============================================================================
// 7. UI Rendering & DOM Updaters
// ==============================================================================

/**
 * Update the wallet button and address pill based on connection state
 */
function updateWalletUI() {
  if (state.currentAccount) {
    DOM.connectWalletBtn.classList.add('hidden');
    DOM.accountInfo.classList.remove('hidden');
    DOM.accountAddress.textContent = shortenAddress(state.currentAccount);
    DOM.accountAddress.title = state.currentAccount;
  } else {
    DOM.connectWalletBtn.classList.remove('hidden');
    DOM.connectWalletBtn.disabled = false;
    DOM.connectWalletBtn.innerHTML = `
      <svg class="metamask-fox" width="20" height="20" viewBox="0 0 32 32" fill="none">
        <path d="M29.07 3.52L17.7 11.83l2.12-5.02L29.07 3.52z" fill="#E2761B"/>
        <path d="M2.93 3.52l11.26 8.35-2.01-5.06L2.93 3.52z" fill="#E4751F"/>
        <path d="M24.78 22.38l-3.03 4.63 6.54 1.8 1.88-6.32-5.39-.11z" fill="#E4751F"/>
        <path d="M1.83 22.49l1.88 6.32 6.54-1.8-3.03-4.63-5.39.11z" fill="#E4751F"/>
        <path d="M10.02 14.17l-1.8 2.7 6.42.28-.24-6.9-4.38 3.92z" fill="#E4751F"/>
        <path d="M21.98 14.17l-4.42-3.96-.2 6.94 6.42-.28-1.8-2.7z" fill="#E4751F"/>
      </svg>
      Connect MetaMask
    `;
    DOM.accountInfo.classList.add('hidden');
  }
}

/**
 * Update the network status pill and switch button
 */
function updateNetworkUI(isSepolia, label) {
  DOM.networkName.textContent = label;
  DOM.networkPill.className = 'network-pill';

  if (!isMetaMaskInstalled()) {
    DOM.networkPill.classList.add('network-unknown');
    DOM.switchNetworkBtn.classList.add('hidden');
  } else if (isSepolia) {
    DOM.networkPill.classList.add('network-sepolia');
    DOM.switchNetworkBtn.classList.add('hidden');
  } else {
    DOM.networkPill.classList.add('network-wrong');
    DOM.switchNetworkBtn.classList.remove('hidden');
  }
}

/**
 * Update the Voter Status Banner and badge
 */
function updateVoterStatusUI() {
  DOM.voterStatusCard.className = 'voter-status-card';

  if (!state.currentAccount) {
    // State: Disconnected
    DOM.voterStatusCard.classList.add('status-disconnected');
    DOM.statusTitle.textContent = 'Wallet Not Connected';
    DOM.statusMessage.textContent = 'Connect your MetaMask wallet above to check your voting eligibility and submit your vote.';
    DOM.statVoterStatusBadge.textContent = 'Disconnected';
    DOM.statVoterStatusBadge.style.color = 'var(--text-muted)';
    DOM.statusIcon.innerHTML = `
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    `;
  } else if (!state.isSepolia) {
    // State: Wrong Network
    DOM.voterStatusCard.classList.add('status-wrong-network');
    DOM.statusTitle.textContent = 'Wrong Network Selected';
    DOM.statusMessage.textContent = 'Your wallet is connected, but you are not on Sepolia Testnet. Please click "Switch to Sepolia" to interact with the contract.';
    DOM.statVoterStatusBadge.textContent = 'Wrong Network';
    DOM.statVoterStatusBadge.style.color = 'var(--warning)';
    DOM.statusIcon.innerHTML = `
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    `;
  } else if (state.hasVoted) {
    // State: Already Voted
    DOM.voterStatusCard.classList.add('status-voted');
    DOM.statusTitle.textContent = 'Vote Recorded on Blockchain';
    DOM.statusMessage.textContent = `You have already cast your vote with address ${shortenAddress(state.currentAccount)}. Each wallet address may only vote once.`;
    DOM.statVoterStatusBadge.textContent = 'Already Voted';
    DOM.statVoterStatusBadge.style.color = 'var(--purple)';
    DOM.statusIcon.innerHTML = `
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    `;
  } else {
    // State: Eligible to Vote
    DOM.voterStatusCard.classList.add('status-eligible');
    DOM.statusTitle.textContent = 'Eligible to Vote';
    DOM.statusMessage.textContent = `Wallet ${shortenAddress(state.currentAccount)} is connected and ready. Choose a candidate below and click "Vote" to sign the transaction.`;
    DOM.statVoterStatusBadge.textContent = 'Eligible';
    DOM.statVoterStatusBadge.style.color = 'var(--success)';
    DOM.statusIcon.innerHTML = `
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    `;
  }
}

/**
 * Update the Top Statistics Summary Cards
 */
function updateStatsUI() {
  DOM.statCandidateCount.textContent = state.candidateCount || state.candidates.length || '3';
  DOM.statTotalVotes.textContent = state.totalVotes;
  DOM.statLeader.textContent = state.leaderName;
}

/**
 * Dynamically render the candidate cards grid
 */
function renderCandidates() {
  // If no candidates loaded yet, keep skeleton
  if (!state.candidates || state.candidates.length === 0) {
    return;
  }

  DOM.candidatesGrid.innerHTML = '';

  state.candidates.forEach((candidate) => {
    const card = document.createElement('div');
    card.className = 'candidate-card';

    // Calculate percentage of votes
    const percentage = state.totalVotes > 0
      ? ((candidate.voteCount / state.totalVotes) * 100).toFixed(1)
      : 0;

    // Check if this candidate is leading
    const isLeading = state.totalVotes > 0 && candidate.voteCount > 0 && state.leaderName.includes(candidate.name);

    // Avatar gradient classes by ID
    let avatarGradient = 'avatar-gradient-default';
    if (candidate.id === 1) avatarGradient = 'avatar-gradient-1';
    else if (candidate.id === 2) avatarGradient = 'avatar-gradient-2';
    else if (candidate.id === 3) avatarGradient = 'avatar-gradient-3';

    // Candidate initial
    const initial = candidate.name.charAt(0).toUpperCase();

    // Determine Vote button state & text
    let buttonHtml = '';
    const isThisCandidateVoting = state.isVotingInProgress && state.votingCandidateId === candidate.id;
    const isAnotherVoting = state.isVotingInProgress && !isThisCandidateVoting;

    if (!state.currentAccount) {
      buttonHtml = `
        <button class="btn btn-secondary btn-vote" onclick="connectWallet()">
          Connect to Vote
        </button>
      `;
    } else if (!state.isSepolia) {
      buttonHtml = `
        <button class="btn btn-warning btn-vote" onclick="switchToSepolia()">
          Switch to Sepolia
        </button>
      `;
    } else if (state.hasVoted) {
      buttonHtml = `
        <button class="btn btn-secondary btn-vote" disabled title="You have already cast your vote">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Already Voted
        </button>
      `;
    } else if (isThisCandidateVoting) {
      buttonHtml = `
        <button class="btn btn-primary btn-vote" disabled>
          <span class="status-dot" style="background:#fff; animation: pulse 0.8s infinite;"></span>
          Confirming in MetaMask...
        </button>
      `;
    } else if (isAnotherVoting) {
      buttonHtml = `
        <button class="btn btn-primary btn-vote" disabled>
          Vote for ${escapeHtml(candidate.name)}
        </button>
      `;
    } else {
      buttonHtml = `
        <button class="btn btn-primary btn-vote" onclick="handleVote(${candidate.id}, '${escapeHtml(candidate.name)}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          Vote for ${escapeHtml(candidate.name)}
        </button>
      `;
    }

    card.innerHTML = `
      <div class="candidate-card-header">
        <span class="candidate-id-badge">Candidate #${candidate.id}</span>
        ${isLeading ? `
          <span class="candidate-leader-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Leading
          </span>
        ` : ''}
      </div>

      <div class="candidate-profile">
        <div class="candidate-avatar ${avatarGradient}">
          ${initial}
        </div>
        <div class="candidate-info">
          <h3 class="candidate-name">${escapeHtml(candidate.name)}</h3>
          <span class="candidate-position">Official Nominee</span>
        </div>
      </div>

      <div class="candidate-stats-box">
        <div class="vote-number-row">
          <div>
            <span class="vote-count-number">${candidate.voteCount}</span>
            <span class="vote-count-label">${candidate.voteCount === 1 ? 'vote' : 'votes'}</span>
          </div>
          <span class="vote-percentage">${percentage}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
        </div>
      </div>

      ${buttonHtml}
    `;

    DOM.candidatesGrid.appendChild(card);
  });
}

/**
 * Display or update the transaction progress tracker banner
 */
function showTxTracker(isPending, title, desc, txHash) {
  DOM.txTrackerSection.classList.remove('hidden');
  DOM.txStatusTitle.textContent = title;
  DOM.txStatusDesc.textContent = desc;

  const spinner = document.getElementById('txSpinner');
  if (spinner) {
    spinner.style.display = isPending ? 'block' : 'none';
  }

  if (txHash) {
    DOM.txHashShort.textContent = shortenHash(txHash);
    DOM.txHashLink.href = `https://sepolia.etherscan.io/tx/${txHash}`;
    DOM.txHashLink.classList.remove('hidden');
  } else {
    DOM.txHashLink.classList.add('hidden');
  }
}

/**
 * Hide the transaction progress tracker banner
 */
function hideTxTracker() {
  DOM.txTrackerSection.classList.add('hidden');
}

// ==============================================================================
// 8. Toast Notifications
// ==============================================================================

/**
 * Display a modern toast notification
 * @param {string} message - Message text
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {string} [linkUrl] - Optional external link URL
 * @param {string} [linkText] - Optional external link text
 */
function showToast(message, type = 'info', linkUrl = null, linkText = 'View on Sepolia Etherscan') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;
  } else if (type === 'error') {
    iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `;
  } else if (type === 'warning') {
    iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
  } else {
    iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
  }

  const linkHtml = linkUrl ? `
    <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="toast-link">
      ${escapeHtml(linkText)}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
    </a>
  ` : '';

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-content">
      <div>${escapeHtml(message)}</div>
      ${linkHtml}
    </div>
    <button class="toast-close" title="Dismiss">&times;</button>
  `;

  // Attach dismiss handler
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  DOM.toastContainer.appendChild(toast);

  // Auto remove after 6 seconds (or 10 seconds for errors with links)
  const duration = linkUrl ? 10000 : 6000;
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// ==============================================================================
// 9. Utility Formatting Helpers
// ==============================================================================

/**
 * Shorten Ethereum address (0x1234...5678)
 */
function shortenAddress(addr) {
  if (!addr) return '';
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
}

/**
 * Shorten Transaction Hash (0x1234...cdef)
 */
function shortenHash(hash) {
  if (!hash) return '';
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
}

/**
 * Escape HTML strings to prevent XSS injection
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
