# 🚀 Contract Deployment & Frontend Connection Guide

## Step 1: Deploy Your Contract

You have the complete ABI integrated! Now deploy your contract to Monad testnet.

### Option A: Using the deployment script
```bash
cd packages/foundry
export PRIVATE_KEY=your_private_key_here
./deploy.sh
```

### Option B: Manual deployment
```bash
cd packages/foundry
forge script script/DeploySimpleMafia.s.sol --rpc-url monadTestnet --private-key YOUR_PRIVATE_KEY --broadcast
```

## Step 2: Copy Your Deployed Contract Address

After successful deployment, you'll see output like:
```
SimpleMafia deployed at: 0x1234567890abcdef1234567890abcdef12345678
```

**Copy this contract address!**

## Step 3: Connect Frontend to Your Contract

### Method 1: Use the UI (Recommended)
1. Start the frontend: `cd packages/nextjs && yarn dev`
2. Open http://localhost:3000
3. Connect your wallet
4. Paste your contract address in the "Enter Existing Contract Address" field
5. Click "Join Existing Game"

### Method 2: Set as Default Contract
If you want to set this as the default contract for everyone, you can update the page.tsx:

```typescript
// In packages/nextjs/app/page.tsx, line 12:
const [contractAddress, setContractAddress] = useState<string>("0xYOUR_CONTRACT_ADDRESS_HERE");
```

## Step 4: Start Playing!

1. **Connect Wallets**: Have 5 players connect their wallets
2. **Join Game**: Each player clicks "Join Game" and pays 0.1 ETH
3. **Game Starts**: When 5th player joins, game automatically starts
4. **Play**: Follow the UI for day voting and night phases
5. **Win**: Winners automatically receive the prize pool!

## 🎮 Game Features Now Connected

✅ **Complete ABI Integration**: All contract functions available  
✅ **Real-time Updates**: Events automatically update the UI  
✅ **Secure Voting**: Commit-reveal voting system  
✅ **Automatic Payouts**: Winners receive ETH automatically  
✅ **Phase Management**: UI adapts to game phases  
✅ **Role-based Actions**: Mafia gets special night voting  

## 🔧 Technical Notes

- **ABI**: Complete contract ABI with all functions and events
- **Events**: Frontend listens to all contract events for real-time updates
- **Gas**: Optimized contract calls for efficient gas usage
- **Error Handling**: Complete error handling and user feedback

## Ready to Play! 🎉

Your on-chain Mafia game is now fully connected and ready for deployment on Monad testnet!
