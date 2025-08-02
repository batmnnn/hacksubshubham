//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { SimpleMafia } from "../contracts/SimpleMafia.sol";

/**
 * @notice Deploy SimpleMafia contract for Monad Testnet
 * @dev Run with: yarn deploy --file DeploySimpleMafia.s.sol
 * @dev Or: forge script script/DeploySimpleMafia.s.sol:DeploySimpleMafia --rpc-url $MONAD_RPC_URL --private-key $PRIVATE_KEY --broadcast
 */
contract DeploySimpleMafia is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy SimpleMafia contract
        SimpleMafia simpleMafia = new SimpleMafia();
        
        console.log("SimpleMafia deployed at:", address(simpleMafia));
        
        // Log contract details for easy frontend integration
        console.log("Entry Fee:", simpleMafia.ENTRY_FEE());
        console.log("Max Players:", simpleMafia.MAX_PLAYERS());
        console.log("Mafia Count:", simpleMafia.MAFIA_COUNT());
        console.log("Town Count:", simpleMafia.TOWN_COUNT());
        
        // Export the contract address for the frontend
        exportDeployments();
    }
}
