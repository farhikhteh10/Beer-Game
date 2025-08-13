"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PLAYER_ROLES, type GameSettings, type PlayerRole } from "@/types/game"
import { useGame } from "@/contexts/game-context"

interface GameSetupProps {
  onStartGame: () => void
}

export function GameSetup({ onStartGame }: GameSetupProps) {
  const { initializeGame } = useGame()
  const [settings, setSettings] = useState<GameSettings>({
    totalWeeks: 35,
    initialInventory: 12,
    initialBacklog: 0,
    holdingCost: 0.5,
    backlogCost: 1.0,
    playerNames: {
      retailer: "خرده‌فروش",
      wholesaler: "عمده‌فروش",
      distributor: "توزیع‌کننده",
      factory: "کارخانه",
    },
  })

  const handlePlayerNameChange = (role: PlayerRole, name: string) => {
    setSettings((prev) => ({
      ...prev,
      playerNames: {
        ...prev.playerNames,
        [role]: name,
      },
    }))
  }

  const handleStartGame = () => {
    initializeGame(settings)
    onStartGame()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">تنظیمات بازی</CardTitle>
          <CardDescription>قبل از شروع شبیه‌سازی، تنظیمات بازی و نام بازیکنان را پیکربندی کنید.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalWeeks">تعداد کل هفته‌ها</Label>
              <Input
                id="totalWeeks"
                type="number"
                value={settings.totalWeeks}
                onChange={(e) => setSettings((prev) => ({ ...prev, totalWeeks: Number.parseInt(e.target.value) }))}
                min="10"
                max="50"
              />
            </div>
            <div>
              <Label htmlFor="initialInventory">موجودی اولیه</Label>
              <Input
                id="initialInventory"
                type="number"
                value={settings.initialInventory}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, initialInventory: Number.parseInt(e.target.value) }))
                }
                min="0"
                max="50"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">نام بازیکنان</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLAYER_ROLES.map(({ role, title, description }) => (
                <div key={role} className="space-y-2">
                  <Label htmlFor={role}>{title}</Label>
                  <Input
                    id={role}
                    value={settings.playerNames[role]}
                    onChange={(e) => handlePlayerNameChange(role, e.target.value)}
                    placeholder={title}
                  />
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleStartGame} className="w-full" size="lg">
            شروع بازی آبجو
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>نحوه بازی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">هدف</h4>
              <p className="text-sm text-muted-foreground">
                با مدیریت مؤثر موجودی و سفارشات، کل هزینه‌های خود را به حداقل برسانید. هزینه‌های نگهداری (موجودی) را در
                برابر هزینه‌های عقب‌افتادگی (تقاضای برآورده نشده) متعادل کنید.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">جریان زنجیره تأمین</h4>
              <p className="text-sm text-muted-foreground">مشتری ← خرده‌فروش ← عمده‌فروش ← توزیع‌کننده ← کارخانه</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">هزینه‌ها</h4>
              <p className="text-sm text-muted-foreground">
                هزینه نگهداری: ۰.۵۰ دلار به ازای هر واحد در هفته
                <br />
                هزینه عقب‌افتادگی: ۱.۰۰ دلار به ازای هر واحد در هفته
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">یادگیری کلیدی</h4>
              <p className="text-sm text-muted-foreground">
                مشاهده کنید که چگونه تغییرات کوچک تقاضا در بالادست تقویت می‌شود و "اثر شلاق" را در زنجیره‌های تأمین ایجاد
                می‌کند.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
