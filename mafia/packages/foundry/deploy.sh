#!/bin/bash

echo "🎮 SimpleMafia Deployment Script for Monad Testnet"
echo "=================================================="
echo ""

# Check if private key is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable not set"
    echo ""
    echo "Please set your private key using one of these methods:"
    echo ""
    echo "Method 1 - Export for this session:"
    echo "export PRIVATE_KEY=your_private_key_here"
    echo ""
    echo "Method 2 - Add to .env file:"
    echo "echo 'PRIVATE_KEY=your_private_key_here' >> .env"
    echo ""
    echo "⚠️  WARNING: Never commit your private key to git!"
    echo "⚠️  Make sure .env is in your .gitignore file"
    echo ""
    exit 1
fi

echo "🔍 Checking Monad testnet connection..."
forge script script/DeploySimpleMafia.s.sol --rpc-url monadTestnet --private-key $PRIVATE_KEY --dry-run

if [ $? -eq 0 ]; then
    echo "✅ Connection successful!"
    echo ""
    echo "🚀 Deploying SimpleMafia contract to Monad testnet..."
    echo "📋 Contract details:"
    echo "   - Entry Fee: 0.1 ETH"
    echo "   - Max Players: 5"
    echo "   - Mafia Count: 2"
    echo "   - Town Count: 3"
    echo ""
    
    # Deploy the contract
    forge script script/DeploySimpleMafia.s.sol --rpc-url monadTestnet --private-key $PRIVATE_KEY --broadcast --verify
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Deployment successful!"
        echo "📝 Next steps:"
        echo "1. Copy the deployed contract address from the output above"
        echo "2. Update contractAddress in packages/nextjs/components/mafia/ContractInteraction.tsx"
        echo "3. Start the frontend: cd ../nextjs && yarn dev"
        echo "4. Connect your wallet and start playing!"
    else
        echo "❌ Deployment failed. Check the error messages above."
    fi
else
    echo "❌ Failed to connect to Monad testnet. Please check:"
    echo "   - Your internet connection"
    echo "   - Monad testnet RPC endpoint: https://testnet-rpc.monad.xyz"
    echo "   - Your account has Monad testnet ETH for gas fees"
fi
