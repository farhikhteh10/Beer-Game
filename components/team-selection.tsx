"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTeam } from "@/contexts/team-context"
import { Plus, Users } from "lucide-react"

interface TeamSelectionProps {
  onTeamJoined: () => void
}

export function TeamSelection({ onTeamJoined }: TeamSelectionProps) {
  const { globalState, createNewTeam } = useTeam()
  const [newTeamName, setNewTeamName] = useState("")

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      createNewTeam(newTeamName.trim())
      setNewTeamName("")
      // Redirect to teams page
      window.location.href = "/teams"
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">بازی آبجو</h2>
        <p className="text-amber-700 dark:text-amber-300">تیم جدید ایجاد کنید یا به تیم‌های موجود بپیوندید</p>
      </div>

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
          <CardDescription className="text-center">تیم جدید ایجاد کنید و ۴ بازیکن را دعوت کنید</CardDescription>
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
              onKeyPress={(e) => e.key === "Enter" && handleCreateTeam()}
            />
          </div>
          <Button
            onClick={handleCreateTeam}
            className="w-full bg-amber-600 hover:bg-amber-700"
            disabled={!newTeamName.trim() || globalState.teams.length >= 10}
          >
            <Plus className="w-4 h-4 ml-2" />
            ایجاد تیم و رفتن به صفحه تیم‌ها
          </Button>
          {globalState.teams.length >= 10 && (
            <p className="text-sm text-red-600 text-center">حداکثر ۱۰ تیم قابل ایجاد است</p>
          )}
        </CardContent>
      </Card>

      {/* View Teams Button */}
      {globalState.teams.length > 0 && (
        <Card>
          <CardContent className="p-4 text-center">
            <Button variant="outline" onClick={() => (window.location.href = "/teams")} className="w-full">
              <Users className="w-4 h-4 ml-2" />
              مشاهده تیم‌های موجود ({globalState.teams.length} تیم)
            </Button>
          </CardContent>
        </Card>
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
