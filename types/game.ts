export type PlayerRole = "retailer" | "wholesaler" | "distributor" | "factory"

export interface Player {
  id: string
  name: string
  role: PlayerRole
  inventory: number
  backlog: number
  incomingShipment: number
  outgoingOrder: number
  incomingOrder: number
  outgoingShipment: number
  totalCost: number
  weeklyOrders: number[]
  weeklyShipments: number[]
  weeklyCosts: number[]
}

export interface PlayerSession {
  playerId: string
  playerName: string
  role: PlayerRole | null
  isReady: boolean
  isConnected: boolean
}

export interface MultiplayerState {
  sessionId: string
  currentPlayerId: string
  playerSessions: PlayerSession[]
  gameCreated: boolean
  allPlayersJoined: boolean
}

export interface GameState {
  currentWeek: number
  totalWeeks: number
  players: Player[]
  customerDemand: number[]
  gamePhase: "setup" | "playing" | "finished"
  currentPlayerTurn: number
  allPlayersReady: boolean
}

export interface GameSettings {
  totalWeeks: number
  initialInventory: number
  initialBacklog: number
  holdingCost: number
  backlogCost: number
  playerNames: Record<PlayerRole, string>
}

export function createPlayer(role: PlayerRole, name: string, initialInventory: number): Player {
  return {
    id: role,
    name,
    role,
    inventory: initialInventory,
    backlog: 0,
    incomingShipment: 0,
    outgoingOrder: 0,
    incomingOrder: 0,
    outgoingShipment: 0,
    totalCost: 0,
    weeklyOrders: [],
    weeklyShipments: [],
    weeklyCosts: [],
  }
}

export const PLAYER_ROLES: { role: PlayerRole; title: string; description: string }[] = [
  {
    role: "retailer",
    title: "خرده‌فروش",
    description: "نوشابه را به مشتریان می‌فروشد و از عمده‌فروش سفارش می‌دهد",
  },
  {
    role: "wholesaler",
    title: "عمده‌فروش",
    description: "خرده‌فروشان را تأمین می‌کند و از توزیع‌کننده سفارش می‌دهد",
  },
  {
    role: "distributor",
    title: "توزیع‌کننده",
    description: "عمده‌فروشان را تأمین می‌کند و از کارخانه سفارش می‌دهد",
  },
  {
    role: "factory",
    title: "کارخانه",
    description: "نوشابه تولید می‌کند و توزیع‌کنندگان را تأمین می‌کند",
  },
]

export const DEFAULT_CUSTOMER_DEMAND = [
  4, 4, 4, 4, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
]

export interface Team {
  id: number
  name: string
  players: Player[]
  gameState: GameState
  isComplete: boolean
  finalResults?: TeamResults
}

export interface TeamResults {
  teamId: number
  teamName: string
  totalCost: number
  bullwhipEffect: number
  playerResults: Player[]
  weeklyDemandVariation: number[]
  weeklyOrderVariation: number[]
}

export interface TeamSession {
  teamId: number
  playerSessions: PlayerSession[]
  gameStarted: boolean
  gameFinished: boolean
}

export interface GlobalGameState {
  teams: Team[]
  activeTeams: number
  maxTeams: number
  gamePhase: "team-selection" | "playing" | "results"
  allTeamsFinished: boolean
}

export function createTeam(teamId: number, teamName: string): Team {
  return {
    id: teamId,
    name: teamName,
    players: [],
    gameState: {
      currentWeek: 0,
      totalWeeks: 35,
      players: [],
      customerDemand: DEFAULT_CUSTOMER_DEMAND,
      gamePhase: "setup",
      currentPlayerTurn: 0,
      allPlayersReady: false,
    },
    isComplete: false,
  }
}

export function calculateBullwhipEffect(players: Player[]): number {
  const retailerOrders = players.find((p) => p.role === "retailer")?.weeklyOrders || []
  const factoryOrders = players.find((p) => p.role === "factory")?.weeklyOrders || []

  if (retailerOrders.length === 0 || factoryOrders.length === 0) return 0

  const retailerVariance = calculateVariance(retailerOrders)
  const factoryVariance = calculateVariance(factoryOrders)

  return retailerVariance === 0 ? 0 : factoryVariance / retailerVariance
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return variance
}
