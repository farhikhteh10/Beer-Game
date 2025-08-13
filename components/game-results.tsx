"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGame } from "@/contexts/game-context"

export function GameResults() {
  const { gameState, resetGame } = useGame()

  // Calculate final rankings
  const rankedPlayers = [...gameState.players].sort((a, b) => a.totalCost - b.totalCost)

  const totalSupplyChainCost = gameState.players.reduce((sum, player) => sum + player.totalCost, 0)

  const handleNewGame = () => {
    resetGame()
  }

  const ROLE_NAMES = {
    retailer: "خرده‌فروش",
    wholesaler: "عمده‌فروش",
    distributor: "توزیع‌کننده",
    factory: "کارخانه",
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">بازی تمام شد!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-lg">
            کل هزینه زنجیره تأمین: <span className="font-bold text-2xl">${totalSupplyChainCost.toFixed(2)}</span>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            این بازی اثر شلاق را نشان می‌دهد - چگونه تغییرات کوچک در تقاضای مشتری به دلیل عدم اشتراک‌گذاری اطلاعات،
            نوسانات بزرگ‌تری را در بالادست زنجیره تأمین ایجاد می‌کند.
          </p>
          <Button onClick={handleNewGame} size="lg" className="bg-amber-600 hover:bg-amber-700">
            شروع بازی جدید
          </Button>
        </CardContent>
      </Card>

      {/* Player Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>رتبه‌بندی نهایی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rankedPlayers.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                  <div>
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-muted-foreground">{ROLE_NAMES[player.role]}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${player.totalCost.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    میانگین: ${(player.totalCost / (gameState.currentWeek - 1)).toFixed(2)}/هفته
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Summary */}
      <Card>
        <CardHeader>
          <CardTitle>خلاصه الگوهای سفارش (اثر شلاقی)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameState.players.map((player) => (
              <div key={player.id} className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">
                  {ROLE_NAMES[player.role]} - {player.name}
                </h4>
                <div className="space-y-1 text-sm">
                  <div>کل سفارشات: {player.weeklyOrders.reduce((sum, order) => sum + order, 0)}</div>
                  <div>
                    میانگین سفارش:{" "}
                    {(player.weeklyOrders.reduce((sum, order) => sum + order, 0) / player.weeklyOrders.length).toFixed(
                      1,
                    )}
                  </div>
                  <div>بیشترین سفارش: {Math.max(...player.weeklyOrders)}</div>
                  <div>کمترین سفارش: {Math.min(...player.weeklyOrders)}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            توجه کنید که چگونه تنوع سفارشات در بالادست علی‌رغم تقاضای پایدار مشتری افزایش می‌یابد - این همان اثر شلاق است.
          </p>
        </CardContent>
      </Card>

      {/* Costs Summary */}
      <Card>
        <CardHeader>
          <CardTitle>خلاصه هزینه‌های بازیکنان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankedPlayers.map((player, index) => (
              <div key={player.id} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">
                    {ROLE_NAMES[player.role]} - {player.name}
                  </h4>
                  <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div>کل هزینه: ${player.totalCost.toFixed(2)}</div>
                  <div>میانگین هفتگی: ${(player.totalCost / (gameState.currentWeek - 1)).toFixed(2)}</div>
                  <div>بیشترین هزینه هفتگی: ${Math.max(...player.weeklyCosts).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>بینش‌های کلیدی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold mb-2">اثر شلاق</h4>
              <p className="text-sm text-muted-foreground">
                تغییرات کوچک تقاضا به دلیل دسته‌بندی سفارشات، نوسانات قیمت، جیره‌بندی و بازی کمبود در بالادست تقویت می‌شود.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold mb-2">اشتراک‌گذاری اطلاعات</h4>
              <p className="text-sm text-muted-foreground">
                ارتباط بهتر و شفافیت در سراسر زنجیره تأمین می‌تواند هزینه‌ها و تنوع را به طور قابل توجهی کاهش دهد.
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <h4 className="font-semibold mb-2">استراتژی موجودی</h4>
              <p className="text-sm text-muted-foreground">
                متعادل کردن هزینه‌های نگهداری در برابر هزینه‌های کمبود بسیار مهم است. موجودی زیاد گران است، موجودی کم باعث
                عقب‌افتادگی می‌شود.
              </p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <h4 className="font-semibold mb-2">همکاری</h4>
              <p className="text-sm text-muted-foreground">
                شرکای زنجیره تأمین که با اطلاعات مشترک با هم کار می‌کنند، عملکرد بهتری نسبت به رقابت انفرادی دارند.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
