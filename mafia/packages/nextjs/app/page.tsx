"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ContractInteraction } from "~~/components/mafia/ContractInteraction";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [contractAddress, setContractAddress] = useState<string>("");
  const [showGame, setShowGame] = useState<boolean>(false);

  const handleContractSubmit = () => {
    if (contractAddress && contractAddress.startsWith("0x")) {
      setShowGame(true);
    }
  };

  const deployNewContract = () => {
    // This will be handled by the game components
    setShowGame(true);
    setContractAddress("deploy-new");
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 max-w-4xl w-full">
          <h1 className="text-center mb-8">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold text-primary">5-Player Mafia Game</span>
            <span className="block text-lg text-secondary mt-2">On-Chain Mafia for Monad Testnet</span>
          </h1>

          {!isConnected ? (
            <div className="text-center">
              <div className="alert alert-warning">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span>Please connect your wallet to play the Mafia game on Monad Testnet</span>
              </div>
            </div>
          ) : !showGame ? (
            <div className="flex flex-col items-center space-y-6">
              <div className="flex justify-center items-center space-x-2 flex-col">
                <p className="my-2 font-medium">Connected Address:</p>
                <Address address={connectedAddress} />
              </div>

              <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title justify-center">Choose Game Option</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Enter Existing Contract Address:</span>
                      </label>
                      <input
                        type="text"
                        placeholder="0x..."
                        className="input input-bordered w-full"
                        value={contractAddress}
                        onChange={e => setContractAddress(e.target.value)}
                      />
                    </div>

                    <button
                      className="btn btn-primary w-full"
                      onClick={handleContractSubmit}
                      disabled={!contractAddress || !contractAddress.startsWith("0x")}
                    >
                      Join Existing Game
                    </button>

                    <div className="divider">OR</div>

                    <button className="btn btn-secondary w-full" onClick={deployNewContract}>
                      Deploy New Game Contract
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm opacity-70 max-w-2xl">
                <p className="mb-2">
                  <strong>Game Rules:</strong> 5 players total - 2 Mafia vs 3 Town members
                </p>
                <p className="mb-2">
                  <strong>Entry Fee:</strong> 0.1 ETH per player
                </p>
                <p>
                  <strong>How to Win:</strong> Town wins by eliminating all Mafia. Mafia wins by equaling or
                  outnumbering Town.
                </p>
              </div>
            </div>
          ) : (
            <ContractInteraction
              initialContractAddress={contractAddress === "deploy-new" ? "" : contractAddress}
              deployNew={contractAddress === "deploy-new"}
              onBack={() => setShowGame(false)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
