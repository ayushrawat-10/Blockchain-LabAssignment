# Decentralized Voting System (Voting DApp)

A modern, responsive, and secure Decentralized Voting Application (DApp) built for the **Blockchain Technology Lab Assignment**. This application directly connects with a Solidity smart contract deployed on the **Ethereum Sepolia Testnet** using **HTML5, CSS3, Vanilla JavaScript, ethers.js v6, and MetaMask**.

---

## 📌 Smart Contract Specifications

| Parameter | Value |
| :--- | :--- |
| **Contract Name** | `Voting` |
| **Network** | Ethereum Sepolia Testnet |
| **Chain ID** | `11155111` (`0xaa36a7` in hex) |
| **Deployed Contract Address** | [`0x1aE68E26A44b691200A2743b6bF7706CC1c2039c`](https://sepolia.etherscan.io/address/0x1aE68E26A44b691200A2743b6bF7706CC1c2039c) |
| **Solidity Compiler** | `^0.8.20` |
| **Default Candidates** | 1: Alice, 2: Bob, 3: Charlie |

---

## 📁 Project Directory Structure

```text
Voting-DApp/
├── index.html        # Clean, accessible semantic HTML5 dashboard
├── style.css         # Modern Web3 glassmorphism styling & animations
├── script.js         # Complete Web3 application logic with ethers.js v6
├── Voting.sol        # Deployed Solidity smart contract code
└── README.md         # Comprehensive setup, testing, and lab documentation
```

---

## ⚙️ Tech Stack & Key Features

- **Frontend Core:** HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphism, Responsive UI), Vanilla JavaScript (ES6+).
- **Web3 Integration:** **ethers.js v6** (`BrowserProvider`, `getSigner()`, `ethers.Contract`).
- **Wallet Provider:** MetaMask browser extension.
- **Smart Contract Interfacing:**
  - `getAllCandidates()`: Fetches all candidates and current vote counts dynamically.
  - `getCandidateCount()`: Fetches total registered candidates.
  - `hasVoted(address voter)`: Checks on-chain if the connected wallet has already cast a vote.
  - `vote(uint256 candidateId)`: Submits the vote transaction to Sepolia.
  - `VoteCast` event listener: Real-time on-chain event listening that updates results automatically when a new block is mined.
- **Security & Reliability:**
  - Zero private keys or seed phrases requested or stored.
  - Dynamic wallet connection (never hardcoded).
  - Client-side & on-chain double-check to prevent duplicate votes.
  - Mutex lock (`isVotingInProgress`) to prevent accidental double-clicks or concurrent transaction submissions.
  - Fallback provider for reading candidate counts even before wallet connection.
  - Network enforcement: Prompts and switches user to Sepolia (`0xaa36a7`) automatically if connected to Mainnet or other chains.

---

## 📋 Prerequisites

Before running the application, make sure you have:

1. **MetaMask Extension:** Installed in Chrome, Brave, Firefox, or Edge ([https://metamask.io/download/](https://metamask.io/download/)).
2. **Sepolia Testnet ETH:** You need a small amount of Sepolia ETH (e.g. 0.01 ETH) to pay gas fees for the `vote()` transaction. Free faucets:
   - [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) (Instant, fast)
   - [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
3. **Local HTTP Server Tool:** Any of the following:
   - **Python 3** (pre-installed on most systems)
   - **Node.js** (`npx serve` or `npx http-server`)
   - **VS Code** with the **Live Server** extension

> ⚠️ **Important:** Web3 browser extensions such as MetaMask enforce security restrictions that prevent wallet communication over the `file://` protocol. The application **must** be served via a local development HTTP server (`http://localhost:...`).

---

## 🚀 How to Run the Application Locally

Navigate to the project folder in your terminal:

```bash
cd Voting-DApp
```

Choose any of the following quick methods to launch the local web server:

### Option A: Using Python 3 (Quickest)
```bash
python -m http.server 3000
```
Open your browser and navigate to: **`http://localhost:3000`**

### Option B: Using Node.js (`npx serve`)
```bash
npx serve -l 3000
```
Open your browser and navigate to: **`http://localhost:3000`**

### Option C: Using VS Code Live Server
1. Open the `Voting-DApp` folder in VS Code.
2. Right-click `index.html` and click **"Open with Live Server"**.
3. It will automatically launch in your browser at `http://127.0.0.1:5500/index.html`.

---

## 📖 Step-by-Step User & Testing Guide

### 1. Connecting MetaMask
1. Open the DApp at `http://localhost:3000`.
2. Click the **"Connect MetaMask"** button in the top navigation bar.
3. MetaMask will pop up prompting you to select an account and click **Connect**.
4. Once connected, your shortened address (e.g., `0x1a...039c`) will appear in the top right, and the Voter Status card will update to **"Eligible to Vote"**.

### 2. Switching to Sepolia Testnet
- If your MetaMask is connected to another network (e.g. Ethereum Mainnet, Polygon, Arbitrum), the network pill will turn red (**"Wrong Network"**) and a prominent **"Switch to Sepolia"** button will appear.
- Click **"Switch to Sepolia"**. MetaMask will request permission to switch the network to Sepolia (`Chain ID: 11155111`).
- If Sepolia is not yet configured in your MetaMask, the app will automatically prompt `wallet_addEthereumChain` to add Sepolia with official RPC endpoints.

### 3. Casting a Vote
1. Scroll down to the **Official Candidates** grid. You will see:
   - **Candidate #1: Alice**
   - **Candidate #2: Bob**
   - **Candidate #3: Charlie**
2. Click the **"Vote for [Candidate Name]"** button on your candidate of choice.
3. The button will change to **"Confirming in MetaMask..."** and the Transaction Tracker bar will activate.
4. MetaMask will pop up showing the contract call to `vote(uint256 candidateId)` with estimated gas.
5. Click **Confirm** in MetaMask.
6. The app will display a notification with the transaction hash and a live link to Sepolia Etherscan:
   `https://sepolia.etherscan.io/tx/<txHash>`
7. Once the transaction is mined into a Sepolia block:
   - A success banner will announce: `🎉 Success! Your vote for [Name] was permanently recorded on Sepolia (Block #...)!`.
   - The vote tally for the candidate will immediately increment on the UI.
   - The total votes and leader indicators will refresh.
   - All vote buttons will update to **"Already Voted"** (disabled).
   - Your Voter Status card will switch to **"Vote Recorded on Blockchain"**.

### 4. Duplicate Voting Prevention Test (Lab Requirement)
1. Try to click a vote button again after having already voted.
   - Notice that all vote buttons are permanently disabled and marked **"Already Voted"**.
2. If an attempt is made programmatically or via console, the frontend pre-check calls `hasVoted(voter)` and rejects the request before broadcasting.
3. Even if a raw transaction were forced on-chain, the smart contract's `require(!voters[msg.sender], "You have already voted");` will revert the transaction, ensuring 100% cryptographic integrity.

### 5. Multi-Account Testing (Simulating Multiple Voters)
1. In the MetaMask extension, click your profile circle and switch to a different account (e.g. **Account 2**).
2. The DApp immediately detects the `accountsChanged` event without requiring a page reload.
3. If Account 2 has not voted yet:
   - The Voter Status badge turns green (**"Eligible to Vote"**).
   - The Candidate vote buttons re-enable.
4. Cast a vote with Account 2:
   - The candidate's vote count increments by 1.
   - Account 2's status locks to **"Already Voted"**.
5. Switch back to Account 1:
   - The DApp instantly reflects Account 1's locked status (**"Already Voted"**).

### 6. Verifying On-Chain on Sepolia Etherscan
1. After voting, click the **"View on Sepolia Etherscan"** link in the toast or transaction tracker.
2. Under the **Transaction Details** tab:
   - Status: `Success`
   - To: `Contract 0x1aE68E26A44b691200A2743b6bF7706CC1c2039c (Voting)`
   - Input Data: Shows function `vote(uint256 candidateId)` decoded with your candidate ID.
3. Under the **Logs / Events** tab:
   - Event `VoteCast(address voter, uint256 candidateId, string candidateName)` is emitted with your wallet address and chosen candidate.

---

## 🛡️ Error Handling Matrix

| Scenario | Handled By | User Feedback |
| :--- | :--- | :--- |
| **MetaMask Not Installed** | `isMetaMaskInstalled()` | Shows warning banner and opens MetaMask download link. |
| **User Rejects Connection (4001)** | `catch` block | Displays *"Connection request was rejected in MetaMask."* |
| **Wrong Network** | `checkNetwork()` | Highlights network pill in red and provides one-click *"Switch to Sepolia"* button. |
| **User Rejects Transaction** | `error.code === 'ACTION_REJECTED'` | Displays *"Transaction was rejected in MetaMask."* without breaking app state. |
| **Insufficient Sepolia ETH** | `error.code === 'INSUFFICIENT_FUNDS'` | Displays warning with direct link to Google Cloud / Sepolia faucet. |
| **Already Voted Attempt** | `hasVoted()` check + contract `require` | Buttons disabled; revert error caught: *"Smart contract rejected: This wallet address has already cast a vote."* |
| **RPC / Network Downtime** | Fallback JSON-RPC | Gracefully falls back to public Sepolia RPC nodes to display candidate data. |

---

## 📄 License & Attribution

- **Project:** College Blockchain Technology Lab Assignment
- **License:** MIT License
- **Contract Address:** `0x1aE68E26A44b691200A2743b6bF7706CC1c2039c` (Sepolia Ethereum Testnet)
