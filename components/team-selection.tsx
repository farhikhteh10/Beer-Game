"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useTeam } from "@/contexts/team-context"
import { type PlayerRole, PLAYER_ROLES } from "@/types/game"
import { Users, Plus, Crown, Package, Truck, Factory } from "lucide-react"

interface TeamSelectionProps {
  onTeamJoined: () => void
}

const roleIcons = {
  retailer: Crown,
  wholesaler: Package,
  distributor: Truck,
  factory: Factory,
}

export function TeamSelection({ onTeamJoined }: TeamSelectionProps) {
  const { globalState, joinTeam, createNewTeam } = useTeam()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null)

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      createNewTeam(newTeamName.trim())
      setNewTeamName("")
      setShowCreateForm(false)
    }
  }

  const handleJoinTeam = () => {
    if (selectedTeam && selectedRole && playerName.trim()) {
      joinTeam(selectedTeam, playerName.trim(), selectedRole)
      onTeamJoined()
    }
  }

  const availableTeams = Array.from({ length: 10 }, (_, i) => i + 1).map((id) => {
    const existingTeam = globalState.teams.find((t) => t.id === id)
    return existingTeam || { id, name: `تیم ${id}`, players: [], isComplete: false }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">انتخاب تیم</h2>
        <p className="text-amber-700 dark:text-amber-300">
          یک تیم انتخاب کنید یا تیم جدید ایجاد کنید. هر تیم نیاز به ۴ بازیکن دارد.
        </p>
      </div>

      {/* Create Team Button */}
      <div className="flex justify-center">
        {!showCreateForm ? (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={globalState.teams.length >= 10}
          >
            <Plus className="w-4 h-4 ml-2" />
            ایجاد تیم جدید
          </Button>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">ایجاد تیم جدید</CardTitle>
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
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateTeam} className="flex-1">
                  ایجاد
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">
                  لغو
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableTeams.map((team) => {
          const existingTeam = globalState.teams.find((t) => t.id === team.id)
          const players = existingTeam?.players || []
          const availableRoles = PLAYER_ROLES.filter((role) => !players.some((p) => p.role === role.role))

          return (
            <Card
              key={team.id}
              className={`cursor-pointer transition-all ${
                selectedTeam === team.id ? "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950" : "hover:shadow-md"
              }`}
              onClick={() => setSelectedTeam(team.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Badge variant={players.length === 4 ? "default" : "secondary"}>
                    <Users className="w-3 h-3 ml-1" />
                    {players.length}/4
                  </Badge>
                </div>
                <CardDescription>
                  {players.length === 4 ? "تیم کامل است" : `${4 - players.length} بازیکن مورد نیاز`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-amber-800 dark:text-amber-200">نقش‌های اشغال شده:</div>
                  <div className="flex flex-wrap gap-1">
                    {PLAYER_ROLES.map((role) => {
                      const player = players.find((p) => p.role === role.role)
                      const Icon = roleIcons[role.role]
                      return (
                        <Badge key={role.role} variant={player ? "default" : "outline"} className="text-xs">
                          <Icon className="w-3 h-3 ml-1" />
                          {player ? player.name : role.title}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Join Team Form */}
      {selectedTeam && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              پیوستن به {availableTeams.find((t) => t.id === selectedTeam)?.name}
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
                  const existingTeam = globalState.teams.find((t) => t.id === selectedTeam)
                  return !existingTeam?.players.some((p) => p.role === role.role)
                }).map((role) => {
                  const Icon = roleIcons[role.role]
                  return (
                    <Button
                      key={role.role}
                      variant={selectedRole === role.role ? "default" : "outline"}
                      onClick={() => setSelectedRole(role.role)}
                      className="h-auto p-3 flex flex-col items-center gap-1"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{role.title}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <Button
              onClick={handleJoinTeam}
              disabled={!playerName.trim() || !selectedRole}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              پیوستن به تیم
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
