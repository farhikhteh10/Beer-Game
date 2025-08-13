"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { Player } from "@/types/game"
import { useGame } from "@/contexts/game-context"

interface PlayerCardProps {
  player: Player
}

const ROLE_COLORS = {
  retailer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  wholesaler: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  distributor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  factory: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

const ROLE_NAMES = {
  retailer: "خرده‌فروش",
  wholesaler: "عمده‌فروش",
  distributor: "توزیع‌کننده",
  factory: "کارخانه",
}

export function PlayerCard({ player }: PlayerCardProps) {
  const { updatePlayerOrder } = useGame()
  const [orderInput, setOrderInput] = useState(player.outgoingOrder.toString())

  const handleOrderSubmit = () => {
    const order = Math.max(0, Number.parseInt(orderInput) || 0)
    updatePlayerOrder(player.id, order)
  }

  const handleOrderChange = (value: string) => {
    setOrderInput(value)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{player.name}</CardTitle>
          <Badge className={ROLE_COLORS[player.role]}>{ROLE_NAMES[player.role]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">موجودی:</span>
              <span className="font-medium">{player.inventory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">عقب‌افتادگی:</span>
              <span className="font-medium text-red-600">{player.backlog}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ورودی:</span>
              <span className="font-medium text-green-600">{player.incomingShipment}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">تقاضا:</span>
              <span className="font-medium">{player.incomingOrder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ارسال شده:</span>
              <span className="font-medium">{player.outgoingShipment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">کل هزینه:</span>
              <span className="font-medium">${player.totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Input */}
        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor={`order-${player.id}`} className="text-sm font-medium">
            ثبت سفارش برای هفته آینده
          </Label>
          <div className="flex gap-2">
            <Input
              id={`order-${player.id}`}
              type="number"
              min="0"
              value={orderInput}
              onChange={(e) => handleOrderChange(e.target.value)}
              placeholder="0"
              className="flex-1"
            />
            <Button onClick={handleOrderSubmit} size="sm">
              سفارش
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">سفارش فعلی: {player.outgoingOrder} واحد</p>
        </div>

        {/* Weekly Performance */}
        {player.weeklyCosts.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>هزینه هفته گذشته:</span>
              <span>${player.weeklyCosts[player.weeklyCosts.length - 1]?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>میانگین هزینه هفتگی:</span>
              <span>
                $
                {player.weeklyCosts.length > 0
                  ? (player.weeklyCosts.reduce((a, b) => a + b, 0) / player.weeklyCosts.length).toFixed(2)
                  : "0.00"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
