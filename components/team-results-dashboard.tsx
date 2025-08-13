"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTeam } from "@/contexts/team-context"
import { calculateBullwhipEffect } from "@/types/game"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from "recharts"

export function TeamResultsDashboard() {
  const { globalState, getTeamResults } = useTeam()

  const finishedTeams = getTeamResults()

  if (finishedTeams.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">در انتظار نتایج تیم‌ها</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">هنوز هیچ تیمی بازی خود را تمام نکرده است.</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate team statistics
  const teamStats = finishedTeams
    .map((team) => {
      const totalCost = team.players.reduce((sum, player) => sum + player.totalCost, 0)
      const bullwhipEffect = calculateBullwhipEffect(team.players)
      const avgCostPerPlayer = totalCost / 4

      return {
        teamId: team.id,
        teamName: team.name,
        totalCost,
        avgCostPerPlayer,
        bullwhipEffect,
        players: team.players,
      }
    })
    .sort((a, b) => a.totalCost - b.totalCost)

  // Prepare data for comparison charts
  const teamComparisonData = teamStats.map((team) => ({
    teamName: team.teamName,
    totalCost: team.totalCost,
    bullwhipEffect: team.bullwhipEffect,
    avgCost: team.avgCostPerPlayer,
  }))

  // Prepare bullwhip effect data for all teams
  const bullwhipData = finishedTeams
    .map((team) => {
      const retailer = team.players.find((p) => p.role === "retailer")
      const factory = team.players.find((p) => p.role === "factory")

      if (!retailer || !factory) return null

      return Array.from({ length: Math.min(retailer.weeklyOrders.length, factory.weeklyOrders.length) }, (_, week) => ({
        week: week + 1,
        teamName: team.name,
        [`${team.name}_retailer`]: retailer.weeklyOrders[week] || 0,
        [`${team.name}_factory`]: factory.weeklyOrders[week] || 0,
        customerDemand: team.gameState.customerDemand[week] || 4,
      }))
    })
    .filter(Boolean)

  const ROLE_NAMES = {
    retailer: "خرده‌فروش",
    wholesaler: "عمده‌فروش",
    distributor: "توزیع‌کننده",
    factory: "کارخانه",
  }

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#8dd1e1",
    "#d084d0",
    "#ffb347",
    "#87ceeb",
    "#dda0dd",
    "#98fb98",
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">نتایج نهایی تیم‌ها</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-lg">
            تعداد تیم‌های شرکت‌کننده: <span className="font-bold text-2xl">{finishedTeams.length}</span>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            مقایسه عملکرد تیم‌ها و تحلیل اثر شلاقی در زنجیره تأمین. تیم‌هایی که بهتر همکاری کرده‌اند، هزینه‌های کمتری
            داشته‌اند.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="rankings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rankings">رتبه‌بندی تیم‌ها</TabsTrigger>
          <TabsTrigger value="comparison">مقایسه عملکرد</TabsTrigger>
          <TabsTrigger value="bullwhip">اثر شلاقی</TabsTrigger>
          <TabsTrigger value="insights">تحلیل و بینش</TabsTrigger>
        </TabsList>

        {/* Team Rankings */}
        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>رتبه‌بندی تیم‌ها بر اساس کل هزینه</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamStats.map((team, index) => (
                  <div key={team.teamId} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}>
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-bold text-lg">{team.teamName}</div>
                          <div className="text-sm text-muted-foreground">
                            اثر شلاقی: {team.bullwhipEffect.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">${team.totalCost.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          میانگین هر بازیکن: ${team.avgCostPerPlayer.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {team.players.map((player) => (
                        <div key={player.id} className="text-center p-2 bg-background rounded">
                          <div className="text-xs text-muted-foreground">{ROLE_NAMES[player.role]}</div>
                          <div className="font-semibold">{player.name}</div>
                          <div className="text-sm">${player.totalCost.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Comparison */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>مقایسه کل هزینه‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="teamName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="totalCost" fill="#8884d8" name="کل هزینه" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>اثر شلاقی در تیم‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={teamComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="totalCost" name="کل هزینه" />
                      <YAxis dataKey="bullwhipEffect" name="اثر شلاقی" />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                      <Scatter dataKey="bullwhipEffect" fill="#82ca9d" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  تیم‌هایی که اثر شلاقی کمتری دارند، معمولاً هزینه‌های کمتری نیز دارند.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bullwhip Effect Analysis */}
        <TabsContent value="bullwhip" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مقایسه الگوهای سفارش تیم‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bullwhipData[0] || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="customerDemand"
                      stroke="#000000"
                      strokeWidth={3}
                      name="تقاضای مشتری"
                    />
                    {finishedTeams.map((team, index) => (
                      <Line
                        key={`${team.name}_factory`}
                        type="monotone"
                        dataKey={`${team.name}_factory`}
                        stroke={colors[index % colors.length]}
                        name={`${team.name} - کارخانه`}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                مقایسه سفارشات کارخانه‌ها با تقاضای واقعی مشتری. انحراف بیشتر نشان‌دهنده اثر شلاقی قوی‌تر است.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>آمار اثر شلاقی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.min(...teamStats.map((t) => t.bullwhipEffect)).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">کمترین اثر شلاقی</div>
                  <div className="text-xs mt-1">
                    {
                      teamStats.find((t) => t.bullwhipEffect === Math.min(...teamStats.map((s) => s.bullwhipEffect)))
                        ?.teamName
                    }
                  </div>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">
                    {(teamStats.reduce((sum, t) => sum + t.bullwhipEffect, 0) / teamStats.length).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">میانگین اثر شلاقی</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {Math.max(...teamStats.map((t) => t.bullwhipEffect)).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">بیشترین اثر شلاقی</div>
                  <div className="text-xs mt-1">
                    {
                      teamStats.find((t) => t.bullwhipEffect === Math.max(...teamStats.map((s) => s.bullwhipEffect)))
                        ?.teamName
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights and Analysis */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحلیل عملکرد و بینش‌های کلیدی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold mb-2">اثر شلاقی (Bullwhip Effect)</h4>
                  <p className="text-sm text-muted-foreground">
                    تیم‌هایی که اثر شلاقی کمتری داشته‌اند، معمولاً بهتر با یکدیگر ارتباط برقرار کرده و اطلاعات را به اشتراک
                    گذاشته‌اند. این منجر به کاهش نوسانات سفارشات و هزینه‌های کمتر شده است.
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold mb-2">همکاری تیمی</h4>
                  <p className="text-sm text-muted-foreground">
                    تیم‌های برتر معمولاً استراتژی مشترکی برای مدیریت موجودی داشته و از سفارش‌دهی بیش از حد اجتناب کرده‌اند.
                    این نشان‌دهنده اهمیت هماهنگی در زنجیره تأمین است.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <h4 className="font-semibold mb-2">مدیریت ریسک</h4>
                  <p className="text-sm text-muted-foreground">
                    تیم‌هایی که توازن بهتری بین هزینه‌های نگهداری و کمبود داشته‌اند، عملکرد بهتری داشته‌اند. این نشان می‌دهد
                    که مدیریت موجودی یک هنر است.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <h4 className="font-semibold mb-2">یادگیری سازمانی</h4>
                  <p className="text-sm text-muted-foreground">
                    این شبیه‌سازی نشان می‌دهد که چگونه عدم اشتراک‌گذاری اطلاعات می‌تواند منجر به تصمیمات غیربهینه و هزینه‌های
                    اضافی در سراسر زنجیره تأمین شود.
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">نکات کلیدی برای بهبود عملکرد:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>اشتراک‌گذاری اطلاعات تقاضا در سراسر زنجیره تأمین</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>کاهش اندازه دسته‌های سفارش و افزایش فرکانس سفارش‌دهی</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>استفاده از قیمت‌گذاری پایدار به جای تخفیف‌های دوره‌ای</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>همکاری در برنامه‌ریزی و پیش‌بینی تقاضا</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
