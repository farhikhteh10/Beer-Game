"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTeam } from "@/contexts/team-context"
import { type PlayerRole, PLAYER_ROLES } from "@/types/game"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const roleEmojis = {
  retailer: "👑",
  wholesaler: "📦",
  distributor: "🚛",
  factory: "🏭",
}

export default function TeamsPage() {
  const { globalState, joinTeam } = useTeam()
  const [playerName, setPlayerName] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null)

  const handleJoinTeam = () => {
    if (selectedTeam && selectedRole && playerName.trim()) {
      joinTeam(selectedTeam, playerName.trim(), selectedRole)
      // Redirect to main page to enter lobby
      window.location.href = "/"
    }
  }

  const createdTeams = globalState.teams

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">تیم‌های ایجاد شده</h1>
        <p className="text-amber-700 dark:text-amber-300">
          تیم خود را انتخاب کنید و نقش خود را در زنجیره تأمین انتخاب کنید
        </p>
      </div>

      {/* Back to Home Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          بازگشت به صفحه اصلی
        </Button>
      </div>

      {/* Teams List */}
      {createdTeams.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">هیچ تیمی ایجاد نشده</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              هنوز هیچ تیمی ایجاد نشده است. برای ایجاد تیم جدید به صفحه اصلی بروید.
            </p>
            <Button onClick={() => (window.location.href = "/")}>ایجاد تیم جدید</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {createdTeams.map((team) => {
            const availableRoles = PLAYER_ROLES.filter((role) => !team.players.some((p) => p.role === role.role))

            return (
              <Card
                key={team.id}
                className={`cursor-pointer transition-all ${
                  selectedTeam === team.id ? "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950" : "hover:shadow-md"
                } ${team.players.length === 4 ? "opacity-60" : ""}`}
                onClick={() => team.players.length < 4 && setSelectedTeam(team.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Badge variant={team.players.length === 4 ? "default" : "secondary"}>
                      <span className="ml-1">👥</span>
                      {team.players.length}/4
                    </Badge>
                  </div>
                  <CardDescription>
                    {team.players.length === 4 ? "تیم کامل است" : `${4 - team.players.length} بازیکن مورد نیاز`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-amber-800 dark:text-amber-200">نقش‌های اشغال شده:</div>
                    <div className="flex flex-wrap gap-1">
                      {PLAYER_ROLES.map((role) => {
                        const player = team.players.find((p) => p.role === role.role)
                        return (
                          <Badge key={role.role} variant={player ? "default" : "outline"} className="text-xs">
                            <span className="ml-1">{roleEmojis[role.role]}</span>
                            {player ? player.name : role.title}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>

                  {team.gameState.gamePhase === "playing" && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        🎮 بازی در حال انجام است
                      </div>
                    </div>
                  )}

                  {team.gameState.gamePhase === "finished" && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded">
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">✅ بازی تمام شده است</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Join Team Form */}
      {selectedTeam && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              پیوستن به {createdTeams.find((t) => t.id === selectedTeam)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="playerName">نام شما</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                className="text-right"
              />
            </div>

            <div>
              <Label>نقش انتخابی</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PLAYER_ROLES.filter((role) => {
                  const team = createdTeams.find((t) => t.id === selectedTeam)
                  return !team?.players.some((p) => p.role === role.role)
                }).map((role) => (
                  <Button
                    key={role.role}
                    variant={selectedRole === role.role ? "default" : "outline"}
                    onClick={() => setSelectedRole(role.role)}
                    className="h-auto p-3 flex flex-col items-center gap-1"
                  >
                    <span className="text-lg">{roleEmojis[role.role]}</span>
                    <span className="text-xs">{role.title}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleJoinTeam}
              disabled={!playerName.trim() || !selectedRole}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              <span className="ml-2">➡️</span>
              پیوستن به تیم و شروع بازی
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
