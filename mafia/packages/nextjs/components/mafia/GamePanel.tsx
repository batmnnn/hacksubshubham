"use client";

import { useState } from "react";
import type { GameState, Player } from "./ContractInteraction";
import { keccak256, toBytes } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// Simplified ABI for game functions
const GAME_ABI = [
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
  {
    inputs: [],
    name: "getWinners",
    outputs: [{ internalType: "address[]", name: "winners", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface GamePanelProps {
  gameState: GameState;
  players: Player[];
  myRole: number | null;
  contractAddress: string;
  isPlayer: boolean;
  onRefresh: () => void;
}

export const GamePanel: React.FC<GamePanelProps> = ({
  gameState,
  players,
  myRole,
  contractAddress,
  isPlayer,
  onRefresh,
}) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [voteSalt, setVoteSalt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [revealTarget, setRevealTarget] = useState<string>("");
  const [revealSalt, setRevealSalt] = useState<string>("");

  // Phase names
  const phaseNames = ["Lobby", "Day Commit", "Day Reveal", "Night", "Ended"];
  const currentPhaseName = phaseNames[gameState.phase] || "Unknown";

  // Role names
  const getRoleName = (role: number) => (role === 0 ? "Town" : "Mafia");
  const getRoleColor = (role: number) => (role === 0 ? "text-blue-500" : "text-red-500");

  // Commit day vote
  const commitDayVote = async () => {
    if (!selectedTarget || !voteSalt || !walletClient) return;

    try {
      setIsLoading(true);

      // Create commitment hash
      const commitment = keccak256(toBytes(`${selectedTarget}${voteSalt}`));

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: GAME_ABI,
        functionName: "commitDayVote",
        args: [commitment],
      });

      notification.info(`Vote committed: ${hash}`);
      await publicClient?.waitForTransactionReceipt({ hash });
      notification.success("Vote committed successfully!");

      // Clear form and refresh
      setSelectedTarget("");
      setVoteSalt("");
      onRefresh();
    } catch (err: any) {
      notification.error(`Failed to commit vote: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reveal day vote
  const revealDayVote = async () => {
    if (!revealTarget || !revealSalt || !walletClient) return;

    try {
      setIsLoading(true);

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: GAME_ABI,
        functionName: "revealDayVote",
        args: [revealTarget as `0x${string}`, BigInt(revealSalt)],
      });

      notification.info(`Vote revealed: ${hash}`);
      await publicClient?.waitForTransactionReceipt({ hash });
      notification.success("Vote revealed successfully!");

      // Clear form and refresh
      setRevealTarget("");
      setRevealSalt("");
      onRefresh();
    } catch (err: any) {
      notification.error(`Failed to reveal vote: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Night kill vote
  const voteNightKill = async () => {
    if (!selectedTarget || !walletClient) return;

    try {
      setIsLoading(true);

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: GAME_ABI,
        functionName: "voteNightKill",
        args: [selectedTarget as `0x${string}`],
      });

      notification.info(`Night vote cast: ${hash}`);
      await publicClient?.waitForTransactionReceipt({ hash });
      notification.success("Night vote cast successfully!");

      // Clear form and refresh
      setSelectedTarget("");
      onRefresh();
    } catch (err: any) {
      notification.error(`Failed to cast night vote: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Force tally functions
  const forceTally = async (isNight: boolean) => {
    if (!walletClient) return;

    try {
      setIsLoading(true);

      const functionName = isNight ? "forceNightTally" : "forceDayTally";
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: GAME_ABI,
        functionName,
      });

      notification.info(`Forcing tally: ${hash}`);
      await publicClient?.waitForTransactionReceipt({ hash });
      notification.success("Tally forced successfully!");

      onRefresh();
    } catch (err: any) {
      notification.error(`Failed to force tally: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const alivePlayers = players.filter(p => p.isAlive);
  const eligibleTargets = alivePlayers.filter(p => p.address.toLowerCase() !== address?.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center">Game Status</h2>

          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Current Phase</div>
              <div className="stat-value text-sm">{currentPhaseName}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Alive Players</div>
              <div className="stat-value">{gameState.aliveCount}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Your Role</div>
              <div className={`stat-value text-sm ${myRole !== null ? getRoleColor(myRole) : ""}`}>
                {isPlayer ? (myRole !== null ? getRoleName(myRole) : "Hidden") : "Spectator"}
              </div>
            </div>
          </div>

          <button className="btn btn-outline btn-sm" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Refresh"}
          </button>
        </div>
      </div>

      {/* Player List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Players</h3>
          <div className="space-y-2">
            {players.map((player, i) => {
              const isCurrentUser = player.address.toLowerCase() === address?.toLowerCase();
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCurrentUser
                      ? "bg-primary/10 border-primary"
                      : player.isAlive
                        ? "bg-base-200 border-base-300"
                        : "bg-error/10 border-error opacity-60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="avatar placeholder">
                      <div
                        className={`w-8 h-8 rounded-full ${
                          player.isAlive ? "bg-success text-success-content" : "bg-error text-error-content"
                        }`}
                      >
                        <span className="text-xs">{i + 1}</span>
                      </div>
                    </div>
                    <div>
                      <Address address={player.address} size="sm" />
                      {isCurrentUser && <span className="text-xs text-primary ml-2">(You)</span>}
                      {gameState.phase === 4 && player.role !== undefined && (
                        <span className={`text-xs ml-2 ${getRoleColor(player.role)}`}>
                          ({getRoleName(player.role)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`badge ${player.isAlive ? "badge-success" : "badge-error"}`}>
                    {player.isAlive ? "Alive" : "Eliminated"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Game Actions */}
      {isPlayer && gameState.phase !== 4 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Actions</h3>

            {/* Day Commit Phase */}
            {gameState.phase === 1 && (
              <div className="space-y-4">
                <p>Commit your vote for elimination (secret ballot):</p>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Select target to vote for:</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedTarget}
                    onChange={e => setSelectedTarget(e.target.value)}
                  >
                    <option value="">Choose a player...</option>
                    {alivePlayers.map((player, i) => (
                      <option key={i} value={player.address}>
                        Player {players.indexOf(player) + 1}: {player.address.slice(0, 10)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Enter secret salt (remember this!):</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter any secret text..."
                    className="input input-bordered w-full"
                    value={voteSalt}
                    onChange={e => setVoteSalt(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={commitDayVote}
                  disabled={!selectedTarget || !voteSalt || isLoading}
                >
                  {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Commit Vote"}
                </button>
              </div>
            )}

            {/* Day Reveal Phase */}
            {gameState.phase === 2 && (
              <div className="space-y-4">
                <p>Reveal your vote (must match your commitment):</p>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Target you voted for:</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={revealTarget}
                    onChange={e => setRevealTarget(e.target.value)}
                  >
                    <option value="">Choose the player you voted for...</option>
                    {alivePlayers.map((player, i) => (
                      <option key={i} value={player.address}>
                        Player {players.indexOf(player) + 1}: {player.address.slice(0, 10)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Your secret salt:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter the same salt you used..."
                    className="input input-bordered w-full"
                    value={revealSalt}
                    onChange={e => setRevealSalt(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={revealDayVote}
                  disabled={!revealTarget || !revealSalt || isLoading}
                >
                  {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Reveal Vote"}
                </button>

                <button className="btn btn-warning btn-sm" onClick={() => forceTally(false)} disabled={isLoading}>
                  Force Day Tally
                </button>
              </div>
            )}

            {/* Night Phase - Mafia only */}
            {gameState.phase === 3 && myRole === 1 && (
              <div className="space-y-4">
                <p className="text-red-500">🗡️ Mafia Night Phase: Choose a Town member to eliminate</p>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Select target to eliminate:</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedTarget}
                    onChange={e => setSelectedTarget(e.target.value)}
                  >
                    <option value="">Choose a Town member...</option>
                    {eligibleTargets.map((player, i) => (
                      <option key={i} value={player.address}>
                        Player {players.indexOf(player) + 1}: {player.address.slice(0, 10)}...
                      </option>
                    ))}
                  </select>
                </div>

                <button className="btn btn-error" onClick={voteNightKill} disabled={!selectedTarget || isLoading}>
                  {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Vote to Eliminate"}
                </button>

                <button className="btn btn-warning btn-sm" onClick={() => forceTally(true)} disabled={isLoading}>
                  Force Night Tally
                </button>
              </div>
            )}

            {/* Night Phase - Town */}
            {gameState.phase === 3 && myRole === 0 && (
              <div className="text-center py-4">
                <p>🌙 Night Phase: The Mafia is choosing their target...</p>
                <p className="text-sm opacity-70">Wait for the night to end.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game End */}
      {gameState.phase === 4 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title justify-center">🎉 Game Ended!</h3>
            <div className="text-center space-y-4">
              <p className="text-lg">
                <strong>{gameState.aliveMafiaCount > 0 ? "Mafia Wins!" : "Town Wins!"}</strong>
              </p>
              <p>Prize distribution completed to winning players.</p>
              <p className="text-sm opacity-70">All roles are now revealed above.</p>
            </div>
          </div>
        </div>
      )}

      {!isPlayer && (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>You are spectating this game. Only players can vote.</span>
        </div>
      )}
    </div>
  );
};
