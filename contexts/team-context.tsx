"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { Team, GlobalGameState, PlayerRole } from "@/types/game"
import {
  createTeam as dbCreateTeam,
  getTeams,
  createPlayer as dbCreatePlayer,
  getPlayerBySession,
  updatePlayerReady,
  createGame,
} from "@/lib/database/operations"

interface TeamContextType {
  globalState: GlobalGameState
  currentPlayerSession: PlayerSession | null
  loading: boolean
  joinTeam: (teamId: number, playerName: string, role: PlayerRole) => Promise<boolean>
  createNewTeam: (teamName: string) => Promise<number | null>
  startTeamGame: (teamId: number) => Promise<boolean>
  finishTeamGame: (teamId: number) => Promise<boolean>
  getCurrentPlayerTeam: () => Team | null
  getTeamResults: () => Team[]
  refreshTeams: () => Promise<void>
  setPlayerReady: (isReady: boolean) => Promise<boolean>
}

interface PlayerSession {
  playerId: string
  teamId: number
  playerName: string
  role: PlayerRole
}

type TeamAction =
  | { type: "SET_TEAMS"; teams: Team[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_CURRENT_PLAYER"; session: PlayerSession | null }
  | { type: "UPDATE_TEAM"; team: Team }
  | { type: "SET_GAME_PHASE"; phase: string }

interface ExtendedGlobalGameState extends GlobalGameState {
  currentPlayerSession: PlayerSession | null
  loading: boolean
}

const initialState: ExtendedGlobalGameState = {
  teams: [],
  activeTeams: 0,
  maxTeams: 10,
  gamePhase: "team-selection",
  allTeamsFinished: false,
  currentPlayerSession: null,
  loading: true,
}

function teamReducer(state: ExtendedGlobalGameState, action: TeamAction): ExtendedGlobalGameState {
  switch (action.type) {
    case "SET_TEAMS":
      return {
        ...state,
        teams: action.teams,
        activeTeams: action.teams.length,
        loading: false,
      }

    case "SET_LOADING":
      return {
        ...state,
        loading: action.loading,
      }

    case "SET_CURRENT_PLAYER":
      return {
        ...state,
        currentPlayerSession: action.session,
      }

    case "UPDATE_TEAM":
      return {
        ...state,
        teams: state.teams.map((t) => (t.id === action.team.id ? action.team : t)),
      }

    case "SET_GAME_PHASE":
      return {
        ...state,
        gamePhase: action.phase,
      }

    default:
      return state
  }
}

// Generate a unique session ID for the current browser session
function generateSessionId(): string {
  if (typeof window !== "undefined") {
    let sessionId = localStorage.getItem("beer-game-session-id")
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("beer-game-session-id", sessionId)
    }
    return sessionId
  }
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const [globalState, dispatch] = useReducer(teamReducer, initialState)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    dispatch({ type: "SET_LOADING", loading: true })

    // Load teams
    await refreshTeams()

    // Check if current session has a player
    const sessionId = generateSessionId()
    const { data: player } = await getPlayerBySession(sessionId)

    if (player) {
      const playerSession: PlayerSession = {
        playerId: player.id.toString(),
        teamId: player.team_id,
        playerName: player.name,
        role: player.role as PlayerRole,
      }
      dispatch({ type: "SET_CURRENT_PLAYER", session: playerSession })
    }

    dispatch({ type: "SET_LOADING", loading: false })
  }

  const refreshTeams = async () => {
    const { data: teams, error } = await getTeams()
    if (teams && !error) {
      const transformedTeams: Team[] = teams.map((dbTeam: any) => ({
        id: dbTeam.id,
        name: dbTeam.name,
        players:
          dbTeam.players?.map((dbPlayer: any) => ({
            id: dbPlayer.id.toString(),
            role: dbPlayer.role,
            name: dbPlayer.name,
            inventory: 12, // Default initial inventory
            backlog: 0,
            incomingShipment: 0,
            outgoingOrder: 0,
            cost: 0,
            isReady: dbPlayer.is_ready,
          })) || [],
        isComplete: (dbTeam.players?.length || 0) >= 4,
        gameState: {
          gamePhase: "setup",
          currentWeek: 1,
          totalWeeks: 25,
          customerDemand: 4,
        },
      }))

      dispatch({ type: "SET_TEAMS", teams: transformedTeams })
    }
  }

  const joinTeam = async (teamId: number, playerName: string, role: PlayerRole): Promise<boolean> => {
    try {
      const sessionId = generateSessionId()

      const { data: player, error } = await dbCreatePlayer(teamId, playerName, role, sessionId)

      if (error || !player) {
        console.error("Failed to join team:", error)
        return false
      }

      // Update current player session
      const playerSession: PlayerSession = {
        playerId: player.id.toString(),
        teamId: teamId,
        playerName: playerName,
        role: role,
      }

      dispatch({ type: "SET_CURRENT_PLAYER", session: playerSession })

      // Refresh teams to get updated data
      await refreshTeams()

      return true
    } catch (error) {
      console.error("Failed to join team:", error)
      return false
    }
  }

  const createNewTeam = async (teamName: string): Promise<number | null> => {
    try {
      const { data: team, error } = await dbCreateTeam(teamName)

      if (error || !team) {
        console.error("Failed to create team:", error)
        return null
      }

      // Refresh teams to include the new team
      await refreshTeams()

      return team.id
    } catch (error) {
      console.error("Failed to create team:", error)
      return null
    }
  }

  const startTeamGame = async (teamId: number): Promise<boolean> => {
    try {
      const { data: game, error } = await createGame(teamId)

      if (error || !game) {
        console.error("Failed to start team game:", error)
        return false
      }

      dispatch({ type: "SET_GAME_PHASE", phase: "playing" })
      return true
    } catch (error) {
      console.error("Failed to start team game:", error)
      return false
    }
  }

  const finishTeamGame = async (teamId: number): Promise<boolean> => {
    try {
      // This will be implemented when we update the game context
      dispatch({ type: "SET_GAME_PHASE", phase: "finished" })
      return true
    } catch (error) {
      console.error("Failed to finish team game:", error)
      return false
    }
  }

  const setPlayerReady = async (isReady: boolean): Promise<boolean> => {
    if (!globalState.currentPlayerSession) return false

    try {
      const playerId = Number.parseInt(globalState.currentPlayerSession.playerId)
      const { error } = await updatePlayerReady(playerId, isReady)

      if (error) {
        console.error("Failed to update player ready status:", error)
        return false
      }

      // Refresh teams to get updated ready status
      await refreshTeams()
      return true
    } catch (error) {
      console.error("Failed to update player ready status:", error)
      return false
    }
  }

  const getCurrentPlayerTeam = (): Team | null => {
    if (!globalState.currentPlayerSession) return null
    return globalState.teams.find((team) => team.id === globalState.currentPlayerSession!.teamId) || null
  }

  const getTeamResults = (): Team[] => {
    return globalState.teams.filter((team) => team.gameState.gamePhase === "finished")
  }

  return (
    <TeamContext.Provider
      value={{
        globalState,
        currentPlayerSession: globalState.currentPlayerSession,
        loading: globalState.loading,
        joinTeam,
        createNewTeam,
        startTeamGame,
        finishTeamGame,
        getCurrentPlayerTeam,
        getTeamResults,
        refreshTeams,
        setPlayerReady,
      }}
    >
      {children}
    </TeamContext.Provider>
  )
}

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider")
  }
  return context
}
