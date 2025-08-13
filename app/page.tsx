"use client"

import { useState } from "react"
import { GameSetup } from "@/components/game-setup"
import { MultiplayerLobby } from "@/components/multiplayer-lobby"
import { GameBoard } from "@/components/game-board"
import { TeamSelection } from "@/components/team-selection"
import { TeamResultsDashboard } from "@/components/team-results-dashboard"
import { GameProvider } from "@/contexts/game-context"
import { TeamProvider, useTeam } from "@/contexts/team-context"

function BeerGameContent() {
  const [gamePhase, setGamePhase] = useState<"team-selection" | "lobby" | "setup" | "playing" | "results">(
    "team-selection",
  )
  const { globalState } = useTeam()

  // Check if all teams are finished to show results
  if (globalState.gamePhase === "results") {
    return <TeamResultsDashboard />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2">بازی توزیع آبجو - چندنفره</h1>
        <p className="text-lg text-amber-700 dark:text-amber-300 max-w-2xl mx-auto">
          اثر شلاق در مدیریت زنجیره تأمین را با دوستان خود تجربه کنید. هر بازیکن یک نقش در زنجیره تأمین آبجو را بر عهده
          می‌گیرد.
        </p>
      </div>

      {gamePhase === "team-selection" && <TeamSelection onTeamJoined={() => setGamePhase("lobby")} />}

      {gamePhase === "lobby" && <MultiplayerLobby onGameStart={() => setGamePhase("setup")} />}

      {gamePhase === "setup" && <GameSetup onStartGame={() => setGamePhase("playing")} />}

      {gamePhase === "playing" && <GameBoard />}
    </div>
  )
}

export default function BeerGamePage() {
  return (
    <TeamProvider>
      <GameProvider>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950">
          <BeerGameContent />
        </div>
      </GameProvider>
    </TeamProvider>
  )
}
