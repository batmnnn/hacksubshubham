"use client";

import type { GameState, Player } from "./ContractInteraction";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

interface LobbyProps {
  gameState: GameState;
  players: Player[];
  isPlayer: boolean;
  onJoinGame: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ gameState, players, isPlayer, onJoinGame, isLoading, onRefresh }) => {
  const { address } = useAccount();

  const canJoin = !isPlayer && gameState.playerCount < 5 && address;

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center">Game Lobby</h2>

          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Players Joined</div>
              <div className="stat-value">{gameState.playerCount}/5</div>
            </div>
            <div className="stat">
              <div className="stat-title">Entry Fee</div>
              <div className="stat-value text-sm">0.1 ETH</div>
            </div>
            <div className="stat">
              <div className="stat-title">Status</div>
              <div className="stat-value text-sm">{gameState.playerCount < 5 ? "Waiting" : "Ready"}</div>
            </div>
          </div>

          <div className="divider">Players</div>

          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => {
              const player = players[i];
              const isCurrentUser = player?.address.toLowerCase() === address?.toLowerCase();

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    player
                      ? isCurrentUser
                        ? "bg-primary/10 border-primary"
                        : "bg-base-200 border-base-300"
                      : "bg-base-100 border-dashed border-base-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="avatar placeholder">
                      <div
                        className={`w-8 h-8 rounded-full ${
                          player ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"
                        }`}
                      >
                        <span className="text-xs">{i + 1}</span>
                      </div>
                    </div>
                    <div>
                      {player ? (
                        <div>
                          <Address address={player.address} size="sm" />
                          {isCurrentUser && <span className="text-xs text-primary ml-2">(You)</span>}
                        </div>
                      ) : (
                        <span className="text-base-content/50">Waiting for player...</span>
                      )}
                    </div>
                  </div>

                  {player && <div className="badge badge-success">Joined</div>}
                </div>
              );
            })}
          </div>

          <div className="card-actions justify-center mt-6 space-x-2">
            {canJoin && (
              <button className="btn btn-primary" onClick={onJoinGame} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Joining...
                  </>
                ) : (
                  <>Join Game (0.1 ETH)</>
                )}
              </button>
            )}

            <button className="btn btn-outline" onClick={onRefresh} disabled={isLoading}>
              {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Refresh"}
            </button>
          </div>

          {!isPlayer && gameState.playerCount >= 5 && (
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
              <span>Game is full! The game will start automatically when 5 players have joined.</span>
            </div>
          )}

          {gameState.playerCount >= 5 && (
            <div className="alert alert-success">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Game starting! All 5 players have joined.</span>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-lg">Game Rules</h3>
          <div className="text-sm space-y-2">
            <p>
              <strong>Setup:</strong> 5 players total - 2 Mafia vs 3 Town
            </p>
            <p>
              <strong>Day Phase:</strong> All players vote to eliminate someone (commit-reveal voting)
            </p>
            <p>
              <strong>Night Phase:</strong> Mafia secretly votes to eliminate a Town member
            </p>
            <p>
              <strong>Win Conditions:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Town wins by eliminating all Mafia members</li>
              <li>Mafia wins by equaling or outnumbering Town members</li>
            </ul>
            <p>
              <strong>Prize:</strong> Winners split the total pot (0.5 ETH)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
