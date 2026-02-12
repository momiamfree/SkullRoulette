SkullRoulette 🎰

SkullRoulette is a simple on-chain roulette game built on Ethereum Sepolia.

Users can buy ERC-20 tokens, approve the contract, and spin the roulette directly on-chain. All results and payouts are handled by a Solidity smart contract, and the frontend reacts to blockchain events in real time.

The goal of this project was to practice full Web3 integration: smart contracts, token mechanics, wallet connection, and frontend state synchronization.

🛠 Tech Stack

- Solidity (Smart Contracts)
- Ethereum Sepolia
- React + Vite + TypeScript
- ethers.js
- wagmi
- RainbowKit
- TailwindCSS

⚙️ Features

- ERC-20 token purchase (payable function)
- Token approval & allowance validation
- On-chain roulette spin
- Event parsing to retrieve spin results
- Real-time balance updates
- Responsive animated roulette UI
- Wallet connection with RainbowKit

📜 Smart Contracts

- ERC-20 Token contract (tickets)
- Roulette contract handling:
  - Bet validation
  - Spin execution
  - Payout calculation
  - Event emission for frontend sync

All game logic is executed on-chain.

🚀 Getting Started

- Clone the repository

git clone https://github.com/yourusername/skullroulette.git
cd skullroulette

- Install dependencies

npm install

- Run locally

npm run dev

Make sure your wallet is connected to Sepolia.

🧪 Network

This project is deployed on:

Ethereum Sepolia Testnet

You’ll need Sepolia ETH to buy tickets and interact with the roulette.

📌 Notes

This is a learning and portfolio project built to demonstrate:

Smart contract interaction patterns

ERC-20 approval flow

Event-driven UI updates

Web3 frontend architecture
