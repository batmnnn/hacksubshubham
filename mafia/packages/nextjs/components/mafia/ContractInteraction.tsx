"use client";

import { useEffect, useState } from "react";
import { GamePanel } from "./GamePanel";
import { Lobby } from "./Lobby";
import { getContract, parseEther } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

// Complete SimpleMafia ABI
const GAME_ABI = [
  {
    inputs: [],
    name: "joinGame",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getGameState",
    outputs: [
      { internalType: "enum SimpleMafia.Phase", name: "phase", type: "uint8" },
      { internalType: "uint256", name: "playersCount", type: "uint256" },
      { internalType: "uint256", name: "alive", type: "uint256" },
      { internalType: "uint256", name: "aliveMafia", type: "uint256" },
      { internalType: "uint256", name: "aliveTown", type: "uint256" },
      { internalType: "bool", name: "started", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPlayers",
    outputs: [
      { internalType: "address[5]", name: "addrs", type: "address[5]" },
      { internalType: "bool[5]", name: "alive", type: "bool[5]" },
      { internalType: "enum SimpleMafia.Role[5]", name: "roles", type: "uint8[5]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyRole",
    outputs: [{ internalType: "enum SimpleMafia.Role", name: "role", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "commitment", type: "bytes32" }],
    name: "commitDayVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "target", type: "address" },
      { internalType: "uint256", name: "salt", type: "uint256" },
    ],
    name: "revealDayVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "target", type: "address" }],
    name: "voteNightKill",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getWinners",
    outputs: [{ internalType: "address[]", name: "winners", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ENTRY_FEE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_PLAYERS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "forceDayTally",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "forceNightTally",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "playerIndex", type: "uint256" },
    ],
    name: "PlayerJoined",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "GameStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "enum SimpleMafia.Phase", name: "newPhase", type: "uint8" }],
    name: "PhaseChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "voter", type: "address" }],
    name: "VoteCommitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: true, internalType: "address", name: "target", type: "address" },
    ],
    name: "VoteRevealed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: true, internalType: "address", name: "target", type: "address" },
    ],
    name: "NightVoteCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "enum SimpleMafia.Role", name: "role", type: "uint8" },
    ],
    name: "PlayerEliminated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "enum SimpleMafia.Role", name: "winnerSide", type: "uint8" },
      { indexed: false, internalType: "address[]", name: "winners", type: "address[]" },
    ],
    name: "GameEnded",
    type: "event",
  },
] as const;

export interface GameState {
  phase: number;
  playerCount: number;
  aliveCount: number;
  aliveMafiaCount: number;
  aliveTownCount: number;
  gameStarted: boolean;
}

export interface Player {
  address: string;
  isAlive: boolean;
  role?: number; // 0 = Town, 1 = Mafia (only revealed when game ends)
}

interface ContractInteractionProps {
  initialContractAddress: string;
  deployNew: boolean;
  onBack: () => void;
}

export const ContractInteraction: React.FC<ContractInteractionProps> = ({
  initialContractAddress,
  deployNew,
  onBack,
}) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [contractAddress, setContractAddress] = useState<string>(initialContractAddress);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myRole, setMyRole] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Get contract instance
  const getContractInstance = () => {
    if (!contractAddress || !publicClient) return null;

    return getContract({
      address: contractAddress as `0x${string}`,
      abi: GAME_ABI,
      client: publicClient,
    });
  };

  // Deploy new contract (simplified version)
  const deployNewContract = async () => {
    if (!deployNew) return;

    setIsLoading(true);
    setError("");

    try {
      // For now, we'll show a message about manual deployment
      // In a full implementation, you'd deploy via Foundry or a deployment service
      notification.info("Deploy your SimpleMafia contract using: yarn deploy");
      notification.info("Then paste the deployed contract address here");

      // Reset to allow user to input deployed address
      setContractAddress("");
      setIsLoading(false);
    } catch (err: any) {
      setError(`Deployment failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Load game state from contract
  const loadGameState = async () => {
    const contract = getContractInstance();
    if (!contract || !address) return;

    try {
      setIsLoading(true);
      setError("");

      // Get game state
      const gameStateResult = await contract.read.getGameState();
      const newGameState: GameState = {
        phase: gameStateResult[0],
        playerCount: Number(gameStateResult[1]),
        aliveCount: Number(gameStateResult[2]),
        aliveMafiaCount: Number(gameStateResult[3]),
        aliveTownCount: Number(gameStateResult[4]),
        gameStarted: gameStateResult[5],
      };
      setGameState(newGameState);

      // Get players
      const playersResult = await contract.read.getPlayers();
      const newPlayers: Player[] = [];
      for (let i = 0; i < 5; i++) {
        if (playersResult[0][i] !== "0x0000000000000000000000000000000000000000") {
          newPlayers.push({
            address: playersResult[0][i],
            isAlive: playersResult[1][i],
            role: newGameState.phase === 4 ? playersResult[2][i] : undefined, // Only show roles when game ended
          });
        }
      }
      setPlayers(newPlayers);

      // Get my role if I'm a player and game has started
      if (newGameState.gameStarted && newPlayers.some(p => p.address.toLowerCase() === address.toLowerCase())) {
        try {
          const roleResult = await contract.read.getMyRole();
          setMyRole(roleResult);
        } catch (err) {
          // Might fail if not a player, that's ok
          console.log("Could not get role:", err);
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      setError(`Failed to load game state: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Join game
  const joinGame = async () => {
    const contract = getContractInstance();
    if (!contract || !walletClient || !address) return;

    try {
      setIsLoading(true);
      setError("");

      const entryFee = parseEther("0.1");

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: GAME_ABI,
        functionName: "joinGame",
        value: entryFee,
      });

      notification.info(`Transaction submitted: ${hash}`);

      // Wait for transaction to be mined
      await publicClient?.waitForTransactionReceipt({ hash });
      notification.success("Successfully joined the game!");

      // Reload game state
      await loadGameState();
    } catch (err: any) {
      setError(`Failed to join game: ${err.message}`);
      notification.error(`Failed to join game: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to load game state when contract address changes
  useEffect(() => {
    if (contractAddress && contractAddress.startsWith("0x")) {
      loadGameState();
    }
  }, [contractAddress, address]);

  // Effect to handle deployment
  useEffect(() => {
    if (deployNew) {
      deployNewContract();
    }
  }, [deployNew]);

  // Auto-refresh game state every 10 seconds
  useEffect(() => {
    if (!contractAddress || !contractAddress.startsWith("0x")) return;

    const interval = setInterval(() => {
      loadGameState();
    }, 10000);

    return () => clearInterval(interval);
  }, [contractAddress]);

  if (deployNew && !contractAddress) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Deploy New Mafia Game</h2>
        <p>To deploy a new SimpleMafia contract:</p>
        <div className="mockup-code text-left">
          <pre data-prefix="$">
            <code>cd packages/foundry</code>
          </pre>
          <pre data-prefix="$">
            <code>
              forge script script/DeploySimpleMafia.s.sol --rpc-url https://testnet-rpc.monad.xyz --private-key
              YOUR_PRIVATE_KEY --broadcast
            </code>
          </pre>
        </div>
        <p>Then paste the deployed contract address below:</p>
        <input
          type="text"
          placeholder="0x..."
          className="input input-bordered w-full max-w-md"
          value={contractAddress}
          onChange={e => setContractAddress(e.target.value)}
        />
        <div>
          <button className="btn btn-primary mr-2" disabled={!contractAddress || !contractAddress.startsWith("0x")}>
            Use Contract
          </button>
          <button className="btn btn-outline" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!contractAddress || !contractAddress.startsWith("0x")) {
    return (
      <div className="text-center">
        <p>Please provide a valid contract address.</p>
        <button className="btn btn-outline mt-4" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  if (isLoading && !gameState) {
    return (
      <div className="text-center">
        <span className="loading loading-spinner loading-lg"></span>
        <p>Loading game state...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
        <button className="btn btn-outline mt-4" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="text-center">
        <p>Failed to load game state.</p>
        <button className="btn btn-outline mt-4" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const isPlayer = players.some(p => p.address.toLowerCase() === address?.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Mafia Game</h2>
        <p className="text-sm opacity-70">Contract: {contractAddress}</p>
        <button className="btn btn-sm btn-outline mt-2" onClick={onBack}>
          Back to Menu
        </button>
      </div>

      {!gameState.gameStarted ? (
        <Lobby
          gameState={gameState}
          players={players}
          isPlayer={isPlayer}
          onJoinGame={joinGame}
          isLoading={isLoading}
          onRefresh={loadGameState}
        />
      ) : (
        <GamePanel
          gameState={gameState}
          players={players}
          myRole={myRole}
          contractAddress={contractAddress}
          isPlayer={isPlayer}
          onRefresh={loadGameState}
        />
      )}
    </div>
  );
};
