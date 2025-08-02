# Deployment Guide for Monad Testnet

## Prerequisites
1. **Get Monad Testnet Tokens**: Visit the Monad testnet faucet to get test MON tokens
2. **Private Key**: Have your wallet private key ready (never commit this to git!)
3. **RPC Access**: Ensure you can connect to `https://testnet-rpc.monad.xyz`

## Method 1: Deploy via Foundry (Recommended)

### Step 1: Setup Environment
```bash
# Navigate to contracts directory
cd packages/foundry

# Set environment variables (or add to .env)
export PRIVATE_KEY="your_private_key_here"
export MONAD_RPC_URL="https://testnet-rpc.monad.xyz"
```

### Step 2: Deploy Contract
```bash
# Deploy SimpleMafia contract to Monad Testnet
forge script script/DeploySimpleMafia.s.sol \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --gas-estimate-multiplier 200

# Or use the named network from foundry.toml
forge script script/DeploySimpleMafia.s.sol \
  --rpc-url monadTestnet \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Step 3: Note the Contract Address
After successful deployment, copy the contract address from the output:
```
SimpleMafia deployed at: 0x1234567890abcdef1234567890abcdef12345678
```

## Method 2: Deploy via Scaffold-ETH Scripts

### Step 1: Configure Networks
Ensure your `.env.local` file has:
```bash
DEPLOYER_PRIVATE_KEY=your_private_key_here
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

### Step 2: Deploy
```bash
# From project root
yarn deploy --network monadTestnet
```

## Verify Deployment

1. **Check the explorer**: Visit https://testnet-explorer.monad.xyz and search for your contract address
2. **Test the contract**: Use the frontend to interact with your deployed contract
3. **Call view functions**: Check that `ENTRY_FEE()` returns 100000000000000000 (0.1 ETH in wei)

## Common Issues

### Gas Estimation Failures
If you see gas estimation errors, try:
```bash
# Add gas limit and price
forge script script/DeploySimpleMafia.s.sol \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --gas-limit 3000000 \
  --gas-price 20000000000
```

### Insufficient Balance
Ensure your deployer wallet has enough MON tokens for gas fees.

### RPC Connection Issues  
Try using a different RPC endpoint or check your internet connection.

## Next Steps

1. **Update Frontend**: Enter your deployed contract address in the frontend
2. **Test the Game**: Invite 4 friends to test the full 5-player experience  
3. **Share Contract**: Share the contract address with other players

## Contract Verification (Optional)

To verify your contract on the Monad explorer:
```bash
# This may not be available immediately on Monad testnet
forge verify-contract \
  --chain-id 10143 \
  --compiler-version v0.8.19 \
  --etherscan-api-key "not-required" \
  YOUR_CONTRACT_ADDRESS \
  src/SimpleMafia.sol:SimpleMafia
```

## Example Deployed Contract
For testing purposes, you can use this example contract address (if available):
`0x...` (Replace with actual deployed address)

Remember to always test with small amounts first!
