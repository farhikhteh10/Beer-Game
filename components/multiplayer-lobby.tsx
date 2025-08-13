"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTeam } from "@/contexts/team-context"
import { useState } from "react"
import type { PlayerRole } from "@/types/game"

const ROLE_LABELS: Record<PlayerRole, string> = {
  retailer: "خرده‌فروش",
  wholesaler: "عمده‌فروش",
  distributor: "توزیع‌کننده",
  factory: "کارخانه",
}

const ROLE_COLORS: Record<PlayerRole, string> = {
  retailer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  wholesaler: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  distributor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  factory: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export function MultiplayerLobby({ onGameStart }: { onGameStart: () => void }) {
  const { currentPlayerSession, getCurrentPlayerTeam, startTeamGame } = useTeam()
  const [playersReady, setPlayersReady] = useState<Record<string, boolean>>({})

  const currentPlayerTeam = getCurrentPlayerTeam()

  if (!currentPlayerTeam || !currentPlayerSession) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>خطا</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600">تیم شما یافت نشد. لطفاً دوباره تیم خود را انتخاب کنید.</p>
        </CardContent>
      </Card>
    )
  }

  const currentPlayer = currentPlayerTeam.players.find((p) => p.id === currentPlayerSession.playerId)
  const allPlayersReady =
    currentPlayerTeam.players.length === 4 && currentPlayerTeam.players.every((player) => playersReady[player.id])

  const handleReady = () => {
    setPlayersReady((prev) => ({
      ...prev,
      [currentPlayerSession.playerId]: !prev[currentPlayerSession.playerId],
    }))
  }

  const handleStartGame = () => {
    startTeamGame(currentPlayerTeam.id)
    onGameStart()
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>اتاق انتظار تیم - {currentPlayerTeam.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-4 bg-muted rounded">
          <p className="text-lg">
            شما به عنوان <strong>{ROLE_LABELS[currentPlayer?.role!]}</strong> در تیم {currentPlayerTeam.name} هستید
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            تیم شماره: <code className="bg-background px-2 py-1 rounded">{currentPlayerTeam.id}</code>
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">اعضای تیم:</h3>
          {currentPlayerTeam.players.map((player) => {
            const isReady = playersReady[player.id] || false
            return (
              <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <Badge className={ROLE_COLORS[player.role]}>{ROLE_LABELS[player.role]}</Badge>
                  <span>{player.name}</span>
                  {player.id === currentPlayerSession.playerId && <Badge variant="outline">شما</Badge>}
                </div>
                <Badge variant={isReady ? "default" : "secondary"}>{isReady ? "آماده" : "در انتظار"}</Badge>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleReady}
            variant={playersReady[currentPlayerSession.playerId] ? "secondary" : "default"}
            className="flex-1"
          >
            {playersReady[currentPlayerSession.playerId] ? "لغو آمادگی" : "آماده هستم"}
          </Button>

          {allPlayersReady && (
            <Button onClick={handleStartGame} className="flex-1 bg-amber-600 hover:bg-amber-700">
              شروع بازی تیمی
            </Button>
          )}
        </div>

        {currentPlayerTeam.players.length < 4 && (
          <p className="text-center text-sm text-muted-foreground">
            در انتظار {4 - currentPlayerTeam.players.length} بازیکن دیگر برای تکمیل تیم...
          </p>
        )}

        {currentPlayerTeam.players.length === 4 && !allPlayersReady && (
          <p className="text-center text-sm text-muted-foreground">در انتظار آمادگی همه اعضای تیم...</p>
        )}
      </CardContent>
    </Card>
  )
}
