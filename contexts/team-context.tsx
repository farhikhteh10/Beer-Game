"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import { type Team, type GlobalGameState, createTeam, type PlayerRole, createPlayer } from "@/types/game"

interface TeamContextType {
  globalState: GlobalGameState
  currentPlayerSession: PlayerSession | null
  joinTeam: (teamId: number, playerName: string, role: PlayerRole) => void
  createNewTeam: (teamName: string) => number
  startTeamGame: (teamId: number) => void
  finishTeamGame: (teamId: number) => void
  getCurrentPlayerTeam: () => Team | null
  getTeamResults: () => Team[]
}

interface PlayerSession {
  playerId: string
  teamId: number
  playerName: string
  role: PlayerRole
}

type TeamAction =
  | { type: "JOIN_TEAM"; teamId: number; playerName: string; role: PlayerRole }
  | { type: "CREATE_TEAM"; teamName: string }
  | { type: "START_TEAM_GAME"; teamId: number }
  | { type: "FINISH_TEAM_GAME"; teamId: number }
  | { type: "UPDATE_TEAM_STATE"; teamId: number; gameState: any }

interface ExtendedGlobalGameState extends GlobalGameState {
  currentPlayerSession: PlayerSession | null
}

const initialState: ExtendedGlobalGameState = {
  teams: [],
  activeTeams: 0,
  maxTeams: 10,
  gamePhase: "team-selection",
  allTeamsFinished: false,
  currentPlayerSession: null,
}

function teamReducer(state: ExtendedGlobalGameState, action: TeamAction): ExtendedGlobalGameState {
  switch (action.type) {
    case "CREATE_TEAM": {
      const newTeamId = state.teams.length + 1
      if (newTeamId > state.maxTeams) return state

      const newTeam = createTeam(newTeamId, action.teamName)
      return {
        ...state,
        teams: [...state.teams, newTeam],
        activeTeams: state.activeTeams + 1,
      }
    }

    case "JOIN_TEAM": {
      const team = state.teams.find((t) => t.id === action.teamId)
      if (!team || team.players.length >= 4) return state

      // Check if role is already taken
      if (team.players.some((p) => p.role === action.role)) return state

      const newPlayer = createPlayer(action.role, action.playerName, 12)
      const updatedTeam = {
        ...team,
        players: [...team.players, newPlayer],
        isComplete: team.players.length + 1 === 4,
      }

      const playerSession: PlayerSession = {
        playerId: newPlayer.id,
        teamId: action.teamId,
        playerName: action.playerName,
        role: action.role,
      }

      return {
        ...state,
        teams: state.teams.map((t) => (t.id === action.teamId ? updatedTeam : t)),
        currentPlayerSession: playerSession,
      }
    }

    case "START_TEAM_GAME": {
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.teamId ? { ...t, gameState: { ...t.gameState, gamePhase: "playing" } } : t,
        ),
        gamePhase: "playing",
      }
    }

    case "FINISH_TEAM_GAME": {
      const updatedTeams = state.teams.map((t) =>
        t.id === action.teamId ? { ...t, gameState: { ...t.gameState, gamePhase: "finished" } } : t,
      )

      const allFinished = updatedTeams.every((t) => t.gameState.gamePhase === "finished")

      return {
        ...state,
        teams: updatedTeams,
        gamePhase: allFinished ? "results" : state.gamePhase,
        allTeamsFinished: allFinished,
      }
    }

    default:
      return state
  }
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const [globalState, dispatch] = useReducer(teamReducer, initialState)

  const joinTeam = (teamId: number, playerName: string, role: PlayerRole) => {
    dispatch({ type: "JOIN_TEAM", teamId, playerName, role })
  }

  const createNewTeam = (teamName: string): number => {
    const newTeamId = globalState.teams.length + 1
    dispatch({ type: "CREATE_TEAM", teamName })
    return newTeamId
  }

  const startTeamGame = (teamId: number) => {
    dispatch({ type: "START_TEAM_GAME", teamId })
  }

  const finishTeamGame = (teamId: number) => {
    dispatch({ type: "FINISH_TEAM_GAME", teamId })
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
        joinTeam,
        createNewTeam,
        startTeamGame,
        finishTeamGame,
        getCurrentPlayerTeam,
        getTeamResults,
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
