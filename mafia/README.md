# � 5-Player On-Chain Mafia Game

<h4 align="center">
  <a href="#game-rules">Game Rules</a> |
  <a href="#quick-start">Quick Start</a> |
  <a href="#deployment">Deployment</a> |
  <a href="#architecture">Architecture</a>
</h4>

🕵️ A complete 5-player Mafia game built on Monad Testnet using Scaffold-ETH 2, Foundry, and Next.js. Features commit-reveal voting, night eliminations, and automatic ETH payouts to winners.

⚙️ Built using **Foundry**, **Next.js 14**, **TypeScript**, **Wagmi v2**, **Viem**, and **DaisyUI**.

## 🎮 Game Features

- ✅ **Fixed 5-Player Games**: 2 Mafia vs 3 Town members
- 🎲 **Commit-Reveal Voting**: Secret ballots during day phases
- 🌙 **Night Phase**: Mafia eliminates Town members
- 💰 **Automatic Payouts**: Winners split the 0.5 ETH prize pool
- 🔄 **Real-time Updates**: Live game state via contract events
- 📱 **Mobile Responsive**: Clean DaisyUI interface

## 🎯 Game Rules

### Setup
- **5 players** join by paying **0.1 ETH** entry fee
- **Roles assigned**: Players 1-2 become Mafia, Players 3-5 become Town
- **Prize Pool**: 0.5 ETH total (winner(s) split the pot)

### Gameplay
1. **Day Phase - Commit**: All players secretly commit votes to eliminate someone
2. **Day Phase - Reveal**: Players reveal their votes (must match commitment)
3. **Night Phase**: Mafia votes to eliminate a Town member
4. **Repeat** until win condition is met

### Win Conditions
- **Town Wins**: Eliminate all Mafia members
- **Mafia Wins**: Equal or outnumber the Town members

## 🚀 Quick Start

### Prerequisites
- [Node.js v20.18.3+](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/)
- [Git](https://git-scm.com/downloads)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mafia-game.git
cd mafia-game

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values (private key, etc.)

# Start local development blockchain (optional - for testing)
yarn chain

# Deploy contracts to Monad Testnet
yarn deploy --network monad

# Start the frontend application
yarn start
```

### Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Required for Monad testnet deployment
DEPLOYER_PRIVATE_KEY=your_private_key_here
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143

# Optional: For enhanced wallet connections
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 📋 How to Play

### 1. Deploy or Join a Game
- **Option A**: Deploy a new game contract on Monad Testnet
- **Option B**: Join an existing game using the contract address

### 2. Join the Lobby
- Connect your wallet (MetaMask recommended)
- Pay 0.1 ETH entry fee to join
- Wait for 5 players total

### 3. Day Phase - Voting
- **Commit**: Choose a player to vote for + enter a secret salt
- **Reveal**: Enter the same player and salt to reveal your vote
- Player with most votes gets eliminated

### 4. Night Phase (Mafia Only)
- Mafia members vote to eliminate a Town member
- Town members wait for morning

### 5. Victory
- **Town**: Eliminate all Mafia to win
- **Mafia**: Equal or outnumber Town to win
- Winners automatically receive ETH payouts

## 🚀 Deployment

### Deploy to Monad Testnet

```bash
# 1. Navigate to contracts directory
cd packages/foundry

# 2. Deploy using Foundry
forge script script/DeploySimpleMafia.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify

# 3. Note the deployed contract address for frontend use
```

### Alternative: Deploy via Scaffold-ETH

```bash
# Deploy using Scaffold-ETH scripts
yarn deploy --network monadTestnet
```

## 🏗 Architecture

### Smart Contract (`SimpleMafia.sol`)
- **Fixed game structure**: 5 players, 2 Mafia, 3 Town
- **Commit-reveal voting**: Prevents vote manipulation
- **Phase management**: Automatic progression through game phases  
- **Ether handling**: Entry fees and winner payouts
- **Event emissions**: Real-time game updates

### Frontend Components
- **`ContractInteraction.tsx`**: Main game coordinator
- **`Lobby.tsx`**: Pre-game player management
- **`GamePanel.tsx`**: In-game voting and actions
- **`PlayerList.tsx`**: Player status display

### Key Features
- **Real-time updates**: Contract event listeners
- **Mobile responsive**: DaisyUI + Tailwind CSS
- **Type safety**: Full TypeScript coverage
- **Error handling**: Graceful failure modes
- **MetaMask integration**: Seamless wallet connection

## 🛠 Development

### Project Structure
```
packages/
├── foundry/          # Smart contracts (Solidity)
│   ├── contracts/    # SimpleMafia.sol
│   ├── script/       # Deployment scripts
│   └── foundry.toml  # Network configurations
└── nextjs/           # Frontend (Next.js)
    ├── app/          # App router pages
    ├── components/   # React components
    └── utils/        # Utilities & hooks
```

### Local Development
```bash
# Terminal 1: Local blockchain
yarn chain

# Terminal 2: Deploy contracts
yarn deploy

# Terminal 3: Start frontend
yarn start

# Visit http://localhost:3000
```

### Testing
```bash
# Run smart contract tests
cd packages/foundry
forge test

# Run frontend tests  
cd packages/nextjs
yarn test
```

## 🌐 Network Configuration

### Monad Testnet Details
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer**: https://testnet-explorer.monad.xyz
- **Faucet**: [Get testnet tokens]

### Adding to MetaMask
1. Open MetaMask
2. Networks → Add Network → Add Manually
3. Enter Monad testnet details above
4. Save and switch to Monad Testnet

## 🎯 Game Contract API

### Key Functions
```solidity
// Join game with 0.1 ETH
function joinGame() external payable

// Commit vote (day phase)
function commitDayVote(bytes32 commitment) external

// Reveal vote (day phase)  
function revealDayVote(address target, uint256 salt) external

// Night kill vote (Mafia only)
function voteNightKill(address target) external

// Get your role
function getMyRole() external view returns (Role)

// Get game state
function getGameState() external view returns (Phase, uint256, uint256, uint256, uint256, bool)
```

### Events
```solidity
event PlayerJoined(address indexed player, uint256 playerIndex)
event GameStarted()
event PhaseChanged(Phase newPhase)
event VoteCommitted(address indexed voter)
event VoteRevealed(address indexed voter, address indexed target)
event NightVoteCast(address indexed voter, address indexed target)  
event PlayerEliminated(address indexed player, Role role)
event GameEnded(Role winnerSide, address[] winners)
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Support

- **Documentation**: See inline code comments
- **Issues**: Create a GitHub issue
- **Discord**: Join the Scaffold-ETH community

---

Built with ❤️ using Scaffold-ETH 2 on Monad Testnet

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn foundry:test`

- Edit your smart contracts in `packages/foundry/contracts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/foundry/script`


## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.