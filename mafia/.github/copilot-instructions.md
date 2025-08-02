<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Scaffold-ETH 2 project for building a 5-player on-chain Mafia game on Monad Testnet.

## Project Structure
- **Smart Contracts**: Located in `packages/foundry/contracts/` using Solidity 0.8.19+
- **Frontend**: Located in `packages/nextjs/` using Next.js 14, TypeScript, and Tailwind CSS
- **Target Network**: Monad Testnet (Chain ID: 10143, RPC: https://testnet-rpc.monad.xyz)

## Key Components
- **SimpleMafia.sol**: Main game contract with 5 players, commit-reveal voting, and Ether payouts
- **ContractInteraction.tsx**: Main game interface component
- **Lobby.tsx**: Pre-game lobby for joining and waiting
- **GamePanel.tsx**: In-game interface for voting and actions

## Technical Requirements
- Use Foundry for smart contract development and deployment
- Follow Scaffold-ETH 2 patterns for React hooks and contract interaction
- Use wagmi and viem for blockchain interactions
- Style with DaisyUI classes (built on Tailwind CSS)
- Implement real-time game state updates via contract events

## Game Rules
- 5 players: 2 Mafia (slots 0,1) vs 3 Town (slots 2,3,4)
- Entry fee: 0.1 ETH per player
- Day phase: Commit-reveal voting to eliminate players
- Night phase: Mafia votes to eliminate Town members
- Win conditions: Town wins by eliminating all Mafia, Mafia wins by equaling/outnumbering Town

## Development Guidelines
- Keep components clean and focused on single responsibilities
- Use TypeScript strictly with proper type definitions
- Handle loading states and errors gracefully
- Provide clear user feedback for all blockchain transactions
- Follow Web3 best practices for wallet connections and transaction handling
