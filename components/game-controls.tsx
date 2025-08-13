"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useGame } from "@/contexts/game-context"

export function GameControls() {
  const { gameState, processWeek, resetGame } = useGame()
  const [processingWeek, setProcessingWeek] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNextWeek = async () => {
    setProcessingWeek(true)
    setError(null)
    try {
      const success = await processWeek()
      if (!success) {
        setError("خطا در پردازش هفته. لطفاً دوباره تلاش کنید.")
      }
    } catch (err) {
      setError("خطا در پردازش هفته. لطفاً دوباره تلاش کنید.")
    } finally {
      setProcessingWeek(false)
    }
  }

  const handleResetGame = () => {
    if (confirm("آیا مطمئن هستید که می‌خواهید بازی را ریست کنید؟ تمام پیشرفت از بین خواهد رفت.")) {
      resetGame()
    }
  }

  const progressPercentage = (gameState.currentWeek / gameState.totalWeeks) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>کنترل‌های بازی</span>
          <div className="flex gap-2">
            <Button
              onClick={handleNextWeek}
              size="lg"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={processingWeek}
            >
              {processingWeek ? (
                <>
                  <span className="mr-2">⏳</span>
                  در حال پردازش...
                </>
              ) : (
                `پردازش هفته ${gameState.currentWeek}`
              )}
            </Button>
            <Button onClick={handleResetGame} variant="outline" size="lg" disabled={processingWeek}>
              ریست بازی
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 rounded text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>پیشرفت بازی</span>
            <span>
              هفته {gameState.currentWeek} از {gameState.totalWeeks}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="font-semibold text-lg">{gameState.customerDemand[gameState.currentWeek - 1] || 4}</div>
            <div className="text-muted-foreground">تقاضای مشتری</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="font-semibold text-lg">
              ${gameState.players.reduce((sum, player) => sum + player.totalCost, 0).toFixed(2)}
            </div>
            <div className="text-muted-foreground">کل هزینه زنجیره تأمین</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="font-semibold text-lg">
              {gameState.players.reduce((sum, player) => sum + player.inventory, 0)}
            </div>
            <div className="text-muted-foreground">کل موجودی</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          برای پیشبرد شبیه‌سازی و مشاهده جریان سفارشات در زنجیره تأمین، روی "پردازش هفته" کلیک کنید.
        </div>
      </CardContent>
    </Card>
  )
}
