"use client";

import type { Player } from "./ContractInteraction";
import { Address } from "~~/components/scaffold-eth";

interface PlayerListProps {
  players: Player[];
  currentUserAddress?: string;
  showRoles?: boolean;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentUserAddress, showRoles = false }) => {
  const getRoleName = (role: number) => (role === 0 ? "Town" : "Mafia");
  const getRoleColor = (role: number) => (role === 0 ? "text-blue-500" : "text-red-500");

  return (
    <div className="space-y-2">
      {players.map((player, i) => {
        const isCurrentUser = player.address.toLowerCase() === currentUserAddress?.toLowerCase();

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
                {showRoles && player.role !== undefined && (
                  <span className={`text-xs ml-2 ${getRoleColor(player.role)}`}>({getRoleName(player.role)})</span>
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
  );
};
