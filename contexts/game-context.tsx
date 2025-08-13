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
import {
  getGameByTeam,
  createGame,
  updateGameStatus,
  saveGameState,
  getGameStates,
  submitPlayerOrder,
} from "@/lib/database/operations"

interface GameContextType {
  gameState: GameState
  multiplayerState: MultiplayerState
  loading: boolean
  updatePlayerOrder: (playerId: string, order: number) => Promise<boolean>
  processWeek: () => Promise<boolean>
  resetGame: () => void
  initializeGame: (settings: GameSettings) => Promise<boolean>
  joinGame: (playerName: string, role: PlayerRole) => void
  setPlayerReady: (ready: boolean) => void
  getCurrentPlayerRole: () => PlayerRole | null
  getCurrentPlayer: () => Player | null
  initializeTeamGame: (teamId: number, teamPlayers: Player[]) => Promise<boolean>
  loadGameState: (teamId: number) => Promise<boolean>
}

const GameContext = createContext<GameContextType | undefined>(undefined)

type GameAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "INITIALIZE_GAME"; payload: GameSettings }
  | { type: "UPDATE_PLAYER_ORDER"; payload: { playerId: string; order: number } }
  | { type: "PROCESS_WEEK" }
  | { type: "RESET_GAME" }
  | { type: "JOIN_GAME"; payload: { playerName: string; role: PlayerRole } }
  | { type: "SET_PLAYER_READY"; payload: { ready: boolean } }
  | { type: "INITIALIZE_TEAM_GAME"; payload: { players: Player[]; teamId: number } }
  | { type: "LOAD_GAME_STATE"; payload: { gameState: GameState; gameId: number } }

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

interface ExtendedState {
  game: GameState
  multiplayer: MultiplayerState
  loading: boolean
  gameId: number | null
  teamId: number | null
}

function gameReducer(state: ExtendedState, action: GameAction): ExtendedState {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: action.loading,
      }

    case "LOAD_GAME_STATE":
      return {
        ...state,
        game: action.payload.gameState,
        gameId: action.payload.gameId,
        loading: false,
      }

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
        teamId: action.payload.teamId,
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

      const newWeek = state.game.currentWeek + 1
      const isFinished = newWeek > state.game.totalWeeks

      return {
        ...state,
        game: {
          ...state.game,
          players: playersWithShipments,
          currentWeek: newWeek,
          gamePhase: isFinished ? "finished" : "playing",
        },
      }

    case "RESET_GAME":
      return {
        game: initialGameState,
        multiplayer: initialMultiplayerState,
        loading: false,
        gameId: null,
        teamId: null,
      }

    default:
      return state
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, {
    game: initialGameState,
    multiplayer: initialMultiplayerState,
    loading: false,
    gameId: null,
    teamId: null,
  })

  const loadGameState = async (teamId: number): Promise<boolean> => {
    dispatch({ type: "SET_LOADING", loading: true })

    try {
      const { data: game, error } = await getGameByTeam(teamId)

      if (error || !game) {
        console.error("Failed to load game:", error)
        dispatch({ type: "SET_LOADING", loading: false })
        return false
      }

      // Load game states (weekly data)
      const { data: gameStates } = await getGameStates(game.id)

      // Transform database game to GameState format
      const gameState: GameState = {
        currentWeek: game.current_week,
        totalWeeks: game.total_weeks,
        players: [], // Will be populated from game states
        customerDemand: DEFAULT_CUSTOMER_DEMAND,
        gamePhase: game.status as any,
        currentPlayerTurn: 0,
        allPlayersReady: false,
      }

      // If we have game states, use the latest one to populate player data
      if (gameStates && gameStates.length > 0) {
        const latestState = gameStates[gameStates.length - 1]
        gameState.players = [
          createPlayer("retailer", "Retailer", latestState.retailer_inventory),
          createPlayer("wholesaler", "Wholesaler", latestState.wholesaler_inventory),
          createPlayer("distributor", "Distributor", latestState.distributor_inventory),
          createPlayer("factory", "Factory", latestState.factory_inventory),
        ]

        // Update player data with latest state
        gameState.players[0].backlog = latestState.retailer_backlog
        gameState.players[0].totalCost = latestState.retailer_cost
        gameState.players[1].backlog = latestState.wholesaler_backlog
        gameState.players[1].totalCost = latestState.wholesaler_cost
        gameState.players[2].backlog = latestState.distributor_backlog
        gameState.players[2].totalCost = latestState.distributor_cost
        gameState.players[3].backlog = latestState.factory_backlog
        gameState.players[3].totalCost = latestState.factory_cost
      } else {
        // Initialize with default players
        gameState.players = [
          createPlayer("retailer", "Retailer", game.initial_inventory),
          createPlayer("wholesaler", "Wholesaler", game.initial_inventory),
          createPlayer("distributor", "Distributor", game.initial_inventory),
          createPlayer("factory", "Factory", game.initial_inventory),
        ]
      }

      dispatch({ type: "LOAD_GAME_STATE", payload: { gameState, gameId: game.id } })
      return true
    } catch (error) {
      console.error("Failed to load game state:", error)
      dispatch({ type: "SET_LOADING", loading: false })
      return false
    }
  }

  const initializeTeamGame = async (teamId: number, teamPlayers: Player[]): Promise<boolean> => {
    try {
      const { data: game, error } = await createGame(teamId)

      if (error || !game) {
        console.error("Failed to create game:", error)
        return false
      }

      dispatch({ type: "INITIALIZE_TEAM_GAME", payload: { players: teamPlayers, teamId } })
      return true
    } catch (error) {
      console.error("Failed to initialize team game:", error)
      return false
    }
  }

  const updatePlayerOrder = async (playerId: string, order: number): Promise<boolean> => {
    if (!state.gameId || !state.teamId) return false

    try {
      // Find the player to get their database ID
      const player = state.game.players.find((p) => p.id === playerId)
      if (!player) return false

      // Submit order to database
      const { error } = await submitPlayerOrder(state.gameId, Number.parseInt(playerId), state.game.currentWeek, order)

      if (error) {
        console.error("Failed to submit player order:", error)
        return false
      }

      // Update local state
      dispatch({ type: "UPDATE_PLAYER_ORDER", payload: { playerId, order } })
      return true
    } catch (error) {
      console.error("Failed to update player order:", error)
      return false
    }
  }

  const processWeek = async (): Promise<boolean> => {
    if (!state.gameId) return false

    try {
      // Process the week locally first
      dispatch({ type: "PROCESS_WEEK" })

      // Save the updated game state to database
      const gameStateData = {
        retailer: state.game.players[0],
        wholesaler: state.game.players[1],
        distributor: state.game.players[2],
        factory: state.game.players[3],
        customerDemand: state.game.customerDemand[state.game.currentWeek - 1] || 4,
      }

      const { error: saveError } = await saveGameState(state.gameId, state.game.currentWeek, gameStateData)

      if (saveError) {
        console.error("Failed to save game state:", saveError)
        return false
      }

      // Update game status if finished
      if (state.game.currentWeek >= state.game.totalWeeks) {
        const { error: statusError } = await updateGameStatus(state.gameId, "finished", state.game.currentWeek)
        if (statusError) {
          console.error("Failed to update game status:", statusError)
        }
      }

      return true
    } catch (error) {
      console.error("Failed to process week:", error)
      return false
    }
  }

  const initializeGame = async (settings: GameSettings): Promise<boolean> => {
    dispatch({ type: "INITIALIZE_GAME", payload: settings })
    return true
  }

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

  const resetGame = () => {
    dispatch({ type: "RESET_GAME" })
  }

  return (
    <GameContext.Provider
      value={{
        gameState: state.game,
        multiplayerState: state.multiplayer,
        loading: state.loading,
        updatePlayerOrder,
        processWeek,
        resetGame,
        initializeGame,
        joinGame,
        setPlayerReady,
        getCurrentPlayerRole,
        getCurrentPlayer,
        initializeTeamGame,
        loadGameState,
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
