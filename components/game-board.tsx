"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGame } from "@/contexts/game-context"
import { useTeam } from "@/contexts/team-context"
import { PlayerCard } from "@/components/player-card"
import { GameControls } from "@/components/game-controls"
import { GameResults } from "@/components/game-results"

const ROLE_LABELS = {
  retailer: "خرده‌فروش",
  wholesaler: "عمده‌فروش",
  distributor: "توزیع‌کننده",
  factory: "کارخانه",
}

export function GameBoard() {
  const { gameState, multiplayerState, getCurrentPlayer, getCurrentPlayerRole } = useGame()
  const { globalState } = useTeam()

  const currentPlayer = getCurrentPlayer()
  const currentRole = getCurrentPlayerRole()

  const currentPlayerTeam = globalState.teams.find((team) =>
    team.players.some((player) => player.id === multiplayerState.currentPlayerId),
  )

  if (gameState.gamePhase === "finished") {
    return <GameResults />
  }

  if (!currentPlayer || !currentRole || !currentPlayerTeam) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>خطا</CardTitle>
        </CardHeader>
        <div className="p-4">
          <p>نقش بازیکن یا تیم پیدا نشد. لطفاً دوباره به بازی بپیوندید.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>
                هفته {gameState.currentWeek} از {gameState.totalWeeks}
              </span>
              <Badge variant="outline">{ROLE_LABELS[currentRole]}</Badge>
              <Badge variant="secondary">{currentPlayerTeam.name}</Badge>
            </div>
            <span className="text-sm font-normal text-muted-foreground">
              تقاضای مشتری: {gameState.customerDemand[gameState.currentWeek - 1] || 4} واحد
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="max-w-md mx-auto">
        <PlayerCard player={currentPlayer} isCurrentPlayer={true} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>وضعیت اعضای تیم</CardTitle>
        </CardHeader>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {currentPlayerTeam.players
              .filter((teamPlayer) => teamPlayer.role !== currentRole)
              .map((teamPlayer) => {
                const session = multiplayerState.playerSessions.find((s) => s.role === teamPlayer.role)
                const hasSubmittedOrder = teamPlayer.outgoingOrder > 0

                return (
                  <div key={teamPlayer.role} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{ROLE_LABELS[teamPlayer.role]}</Badge>
                      <span className="text-sm">{teamPlayer.name}</span>
                    </div>
                    <Badge variant={hasSubmittedOrder ? "default" : "secondary"}>
                      {hasSubmittedOrder ? "سفارش داده" : "در انتظار"}
                    </Badge>
                  </div>
                )
              })}
          </div>
        </div>
      </Card>

      <GameControls />
    </div>
  )
}
