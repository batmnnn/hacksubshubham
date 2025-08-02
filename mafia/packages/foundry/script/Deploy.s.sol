//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { DeploySimpleMafia } from "./DeploySimpleMafia.s.sol";

/**
 * @notice Main deployment script for SimpleMafia on Monad Testnet
 * @dev Run this when you want to deploy the Mafia game contract
 *
 * Example: yarn deploy # runs this script(without`--file` flag)
 */
contract DeployScript is ScaffoldETHDeploy {
    function run() external {
        // Deploy SimpleMafia contract for the on-chain Mafia game
        DeploySimpleMafia deploySimpleMafia = new DeploySimpleMafia();
        deploySimpleMafia.run();
    }
}
