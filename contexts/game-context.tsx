"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import {
  type GameState,
  type GameSettings,
  type Player,
  type PlayerRole,
  type PlayerSession,
  type MultiplayerState,
  DEFAULT_CUSTOMER_DEMAND,
  createPlayer,
} from "@/types/game"

interface GameContextType {
  gameState: GameState
  multiplayerState: MultiplayerState
  updatePlayerOrder: (playerId: string, order: number) => void
  processWeek: () => void
  resetGame: () => void
  initializeGame: (settings: GameSettings) => void
  joinGame: (playerName: string, role: PlayerRole) => void
  setPlayerReady: (ready: boolean) => void
  getCurrentPlayerRole: () => PlayerRole | null
  getCurrentPlayer: () => Player | null
  initializeTeamGame: (teamPlayers: Player[]) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

type GameAction =
  | { type: "INITIALIZE_GAME"; payload: GameSettings }
  | { type: "UPDATE_PLAYER_ORDER"; payload: { playerId: string; order: number } }
  | { type: "PROCESS_WEEK" }
  | { type: "RESET_GAME" }
  | { type: "JOIN_GAME"; payload: { playerName: string; role: PlayerRole } }
  | { type: "SET_PLAYER_READY"; payload: { ready: boolean } }
  | { type: "INITIALIZE_TEAM_GAME"; payload: { players: Player[] } }

const initialGameState: GameState = {
  currentWeek: 0,
  totalWeeks: 35,
  players: [],
  customerDemand: DEFAULT_CUSTOMER_DEMAND,
  gamePhase: "setup",
  currentPlayerTurn: 0,
  allPlayersReady: false,
}

const initialMultiplayerState: MultiplayerState = {
  sessionId: Math.random().toString(36).substring(7),
  currentPlayerId: Math.random().toString(36).substring(7),
  playerSessions: [],
  gameCreated: false,
  allPlayersJoined: false,
}

function gameReducer(
  state: { game: GameState; multiplayer: MultiplayerState },
  action: GameAction,
): { game: GameState; multiplayer: MultiplayerState } {
  switch (action.type) {
    case "JOIN_GAME":
      const { playerName, role } = action.payload
      const newSession: PlayerSession = {
        playerId: state.multiplayer.currentPlayerId,
        playerName,
        role,
        isReady: false,
        isConnected: true,
      }

      const updatedSessions = [...state.multiplayer.playerSessions.filter((s) => s.role !== role), newSession]
      const allJoined = updatedSessions.length === 4

      return {
        ...state,
        multiplayer: {
          ...state.multiplayer,
          playerSessions: updatedSessions,
          allPlayersJoined: allJoined,
        },
      }

    case "SET_PLAYER_READY":
      const updatedReadySessions = state.multiplayer.playerSessions.map((session) =>
        session.playerId === state.multiplayer.currentPlayerId
          ? { ...session, isReady: action.payload.ready }
          : session,
      )

      const allReady = updatedReadySessions.every((s) => s.isReady) && updatedReadySessions.length === 4

      return {
        ...state,
        game: { ...state.game, allPlayersReady: allReady },
        multiplayer: { ...state.multiplayer, playerSessions: updatedReadySessions },
      }

    case "INITIALIZE_GAME":
      const players = state.multiplayer.playerSessions.map((session) =>
        createPlayer(session.role!, session.playerName, action.payload.initialInventory),
      )

      return {
        ...state,
        game: {
          ...state.game,
          players,
          totalWeeks: action.payload.totalWeeks,
          gamePhase: "playing",
          currentWeek: 1,
        },
      }

    case "INITIALIZE_TEAM_GAME":
      return {
        ...state,
        game: {
          ...state.game,
          players: action.payload.players,
          gamePhase: "playing",
          currentWeek: 1,
        },
      }

    case "UPDATE_PLAYER_ORDER":
      return {
        ...state,
        game: {
          ...state.game,
          players: state.game.players.map((player) =>
            player.id === action.payload.playerId ? { ...player, outgoingOrder: action.payload.order } : player,
          ),
        },
      }

    case "PROCESS_WEEK":
      // Process shipments and orders for the week
      const updatedPlayers = state.game.players.map((player, index) => {
        const demand =
          index === 0
            ? state.game.customerDemand[state.game.currentWeek - 1] || 4
            : state.game.players[index - 1]?.outgoingOrder || 0

        // Calculate shipment (limited by inventory + incoming shipment)
        const availableInventory = player.inventory + player.incomingShipment
        const shipment = Math.min(availableInventory, demand + player.backlog)

        // Update inventory and backlog
        const newInventory = Math.max(0, availableInventory - shipment)
        const newBacklog = Math.max(0, demand + player.backlog - shipment)

        // Calculate costs (holding cost for inventory + backlog cost)
        const weeklyCost = newInventory * 0.5 + newBacklog * 1.0

        return {
          ...player,
          inventory: newInventory,
          backlog: newBacklog,
          outgoingShipment: shipment,
          incomingOrder: demand,
          incomingShipment: index === 3 ? player.outgoingOrder : 0, // Factory produces what it ordered
          totalCost: player.totalCost + weeklyCost,
          weeklyOrders: [...player.weeklyOrders, player.outgoingOrder],
          weeklyShipments: [...player.weeklyShipments, shipment],
          weeklyCosts: [...player.weeklyCosts, weeklyCost],
        }
      })

      // Set incoming shipments for next week (shipments flow upstream)
      const playersWithShipments = updatedPlayers.map((player, index) => {
        if (index < 3) {
          return {
            ...player,
            incomingShipment: updatedPlayers[index + 1].outgoingShipment,
          }
        }
        return player
      })

      return {
        ...state,
        game: {
          ...state.game,
          players: playersWithShipments,
          currentWeek: state.game.currentWeek + 1,
          gamePhase: state.game.currentWeek >= state.game.totalWeeks ? "finished" : "playing",
        },
      }

    case "RESET_GAME":
      return {
        game: initialGameState,
        multiplayer: initialMultiplayerState,
      }

    default:
      return state
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, {
    game: initialGameState,
    multiplayer: initialMultiplayerState,
  })

  const joinGame = (playerName: string, role: PlayerRole) => {
    dispatch({ type: "JOIN_GAME", payload: { playerName, role } })
  }

  const setPlayerReady = (ready: boolean) => {
    dispatch({ type: "SET_PLAYER_READY", payload: { ready } })
  }

  const getCurrentPlayerRole = (): PlayerRole | null => {
    const session = state.multiplayer.playerSessions.find((s) => s.playerId === state.multiplayer.currentPlayerId)
    return session?.role || null
  }

  const getCurrentPlayer = (): Player | null => {
    const role = getCurrentPlayerRole()
    return role ? state.game.players.find((p) => p.role === role) || null : null
  }

  const updatePlayerOrder = (playerId: string, order: number) => {
    dispatch({ type: "UPDATE_PLAYER_ORDER", payload: { playerId, order } })
  }

  const processWeek = () => {
    dispatch({ type: "PROCESS_WEEK" })
  }

  const resetGame = () => {
    dispatch({ type: "RESET_GAME" })
  }

  const initializeGame = (settings: GameSettings) => {
    dispatch({ type: "INITIALIZE_GAME", payload: settings })
  }

  const initializeTeamGame = (teamPlayers: Player[]) => {
    dispatch({ type: "INITIALIZE_TEAM_GAME", payload: { players: teamPlayers } })
  }

  return (
    <GameContext.Provider
      value={{
        gameState: state.game,
        multiplayerState: state.multiplayer,
        updatePlayerOrder,
        processWeek,
        resetGame,
        initializeGame,
        joinGame,
        setPlayerReady,
        getCurrentPlayerRole,
        getCurrentPlayer,
        initializeTeamGame,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
