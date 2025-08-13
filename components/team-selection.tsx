"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useTeam } from "@/contexts/team-context"
import type { PlayerRole } from "@/types/game"

interface TeamSelectionProps {
  onTeamJoined: () => void
}

const roleEmojis = {
  retailer: "🏪",
  wholesaler: "🏢",
  distributor: "🚛",
  factory: "🏭",
}

const roleNames = {
  retailer: "خرده‌فروش",
  wholesaler: "عمده‌فروش",
  distributor: "توزیع‌کننده",
  factory: "کارخانه",
}

export function TeamSelection({ onTeamJoined }: TeamSelectionProps) {
  const { globalState, createNewTeam, joinTeam, loading } = useTeam()
  const [newTeamName, setNewTeamName] = useState("")
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [joiningTeam, setJoiningTeam] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateTeam = async () => {
    if (newTeamName.trim()) {
      setCreatingTeam(true)
      setError(null)
      try {
        const teamId = await createNewTeam(newTeamName.trim())
        if (teamId) {
          setNewTeamName("")
          setSelectedTeamId(teamId)
        } else {
          setError("خطا در ایجاد تیم. لطفاً دوباره تلاش کنید.")
        }
      } catch (err) {
        setError("خطا در ایجاد تیم. لطفاً دوباره تلاش کنید.")
      } finally {
        setCreatingTeam(false)
      }
    }
  }

  const handleJoinTeam = async (teamId: number, role: PlayerRole) => {
    if (playerName.trim()) {
      setJoiningTeam(true)
      setError(null)
      try {
        const success = await joinTeam(teamId, playerName.trim(), role)
        if (success) {
          onTeamJoined()
        } else {
          setError("خطا در پیوستن به تیم. ممکن است نقش قبلاً انتخاب شده باشد.")
        }
      } catch (err) {
        setError("خطا در پیوستن به تیم. لطفاً دوباره تلاش کنید.")
      } finally {
        setJoiningTeam(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-2xl mb-4">⏳</div>
            <p>در حال بارگذاری تیم‌ها...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getAvailableRoles = (teamId: number): PlayerRole[] => {
    const team = globalState.teams.find((t) => t.id === teamId)
    if (!team) return []

    const takenRoles = team.players.map((p) => p.role)
    const allRoles: PlayerRole[] = ["retailer", "wholesaler", "distributor", "factory"]
    return allRoles.filter((role) => !takenRoles.includes(role))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">بازی نوشابه</h2>
        <p className="text-amber-700 dark:text-amber-300">تیم جدید ایجاد کنید یا به تیم‌های موجود بپیوندید</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4 text-center text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{globalState.teams.length}</div>
            <div className="text-sm text-muted-foreground">تیم‌های ایجاد شده</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {globalState.teams.reduce((sum, team) => sum + team.players.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">بازیکنان فعال</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Team Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">ایجاد تیم جدید</CardTitle>
          <CardDescription className="text-center">تیم جدید ایجاد کنید و نقش خود را انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="teamName">نام تیم</Label>
            <Input
              id="teamName"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="نام تیم را وارد کنید"
              className="text-right"
              onKeyPress={(e) => e.key === "Enter" && !creatingTeam && handleCreateTeam()}
              disabled={creatingTeam}
            />
          </div>
          <Button
            onClick={handleCreateTeam}
            className="w-full bg-amber-600 hover:bg-amber-700"
            disabled={!newTeamName.trim() || globalState.teams.length >= 10 || creatingTeam}
          >
            {creatingTeam ? (
              <>
                <span className="ml-2">⏳</span>
                در حال ایجاد...
              </>
            ) : (
              <>
                <span className="ml-2">➕</span>
                ایجاد تیم
              </>
            )}
          </Button>
          {globalState.teams.length >= 10 && (
            <p className="text-sm text-red-600 text-center">حداکثر ۱۰ تیم قابل ایجاد است</p>
          )}
        </CardContent>
      </Card>

      {/* Existing Teams */}
      {globalState.teams.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 text-center">تیم‌های موجود</h3>
          <div className="grid gap-4">
            {globalState.teams.map((team) => {
              const availableRoles = getAvailableRoles(team.id)
              const isComplete = team.players.length === 4

              return (
                <Card key={team.id} className={`${isComplete ? "opacity-75" : ""}`}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={isComplete ? "secondary" : "default"}>{team.players.length}/4 بازیکن</Badge>
                        {isComplete && <Badge variant="outline">کامل</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Current Players */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(["retailer", "wholesaler", "distributor", "factory"] as PlayerRole[]).map((role) => {
                        const player = team.players.find((p) => p.role === role)

                        return (
                          <div
                            key={role}
                            className={`p-2 rounded border text-center ${
                              player ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="text-lg mb-1">{roleEmojis[role]}</div>
                            <div className="text-xs font-medium">{roleNames[role]}</div>
                            {player ? (
                              <div className="text-xs text-green-600">{player.name}</div>
                            ) : (
                              <div className="text-xs text-gray-500">خالی</div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Join Team Section */}
                    {!isComplete && (
                      <div className="space-y-3 pt-3 border-t">
                        <div>
                          <Label htmlFor={`playerName-${team.id}`}>نام شما</Label>
                          <Input
                            id={`playerName-${team.id}`}
                            value={selectedTeamId === team.id ? playerName : ""}
                            onChange={(e) => {
                              setPlayerName(e.target.value)
                              setSelectedTeamId(team.id)
                            }}
                            placeholder="نام خود را وارد کنید"
                            className="text-right"
                            disabled={joiningTeam}
                          />
                        </div>

                        <div>
                          <Label>نقش خود را انتخاب کنید</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {availableRoles.map((role) => (
                              <Button
                                key={role}
                                variant={selectedRole === role && selectedTeamId === team.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setSelectedRole(role)
                                  setSelectedTeamId(team.id)
                                }}
                                className="justify-start"
                                disabled={joiningTeam}
                              >
                                <span className="ml-2">{roleEmojis[role]}</span>
                                {roleNames[role]}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleJoinTeam(team.id, selectedRole!)}
                          disabled={!playerName.trim() || !selectedRole || selectedTeamId !== team.id || joiningTeam}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {joiningTeam ? (
                            <>
                              <span className="ml-2">⏳</span>
                              در حال پیوستن...
                            </>
                          ) : (
                            <>
                              <span className="ml-2">👥</span>
                              پیوستن به تیم
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {isComplete && (
                      <div className="text-center py-2">
                        <Badge variant="secondary">این تیم کامل است</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">راهنمای بازی</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• هر تیم نیاز به ۴ بازیکن دارد (خرده‌فروش، عمده‌فروش، توزیع‌کننده، کارخانه)</p>
          <p>• هدف کاهش کل هزینه‌های تیم در زنجیره تأمین است</p>
          <p>• بازی اثر شلاقی در زنجیره تأمین را نشان می‌دهد</p>
          <p>• همکاری و ارتباط بین اعضای تیم کلید موفقیت است</p>
        </CardContent>
      </Card>
    </div>
  )
}
