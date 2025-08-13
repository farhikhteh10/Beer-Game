import type { PlayerRole } from "@/types/game"

// Local storage keys
const TEAMS_KEY = "beer-game-teams"
const PLAYERS_KEY = "beer-game-players"
const GAMES_KEY = "beer-game-games"

// Shared storage keys for cross-browser team visibility
const SHARED_TEAMS_KEY = "beer-game-shared-teams"
const SHARED_PLAYERS_KEY = "beer-game-shared-players"
const SHARED_GAMES_KEY = "beer-game-shared-games"

// Helper functions for localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
  }
}

function getFromSharedStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    // Try to get from shared storage first, then fall back to local storage
    const sharedItem = localStorage.getItem(`shared_${key}`)
    const localItem = localStorage.getItem(key)

    if (sharedItem) {
      const sharedData = JSON.parse(sharedItem)
      // Merge with local data if exists
      if (localItem) {
        const localData = JSON.parse(localItem)
        // For arrays, merge and deduplicate by id
        if (Array.isArray(sharedData) && Array.isArray(localData)) {
          const merged = [...sharedData, ...localData]
          const unique = merged.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))
          return unique as T
        }
      }
      return sharedData
    }

    return localItem ? JSON.parse(localItem) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToSharedStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    // Save to both shared and local storage
    localStorage.setItem(`shared_${key}`, JSON.stringify(value))
    localStorage.setItem(key, JSON.stringify(value))

    window.dispatchEvent(
      new CustomEvent("sharedStorageUpdate", {
        detail: {
          key: `shared_${key}`,
          value: value,
        },
      }),
    )
  } catch (error) {
    console.error("Failed to save to shared storage:", error)
  }
}

// Generate unique IDs
function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000)
}

export async function createTeam(name: string): Promise<{ data: any | null; error: string | null }> {
  try {
    const teams = getFromSharedStorage<any[]>(SHARED_TEAMS_KEY, [])
    const newTeam = {
      id: generateId(),
      name,
      created_at: new Date().toISOString(),
      players: [],
    }

    teams.push(newTeam)
    saveToSharedStorage(SHARED_TEAMS_KEY, teams)

    return { data: newTeam, error: null }
  } catch (error) {
    return { data: null, error: "Failed to create team" }
  }
}

export async function getTeams(): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const teams = getFromSharedStorage<any[]>(SHARED_TEAMS_KEY, [])
    const players = getFromSharedStorage<any[]>(SHARED_PLAYERS_KEY, [])

    // Add players to teams
    const teamsWithPlayers = teams.map((team) => ({
      ...team,
      players: players.filter((player) => player.team_id === team.id),
    }))

    return { data: teamsWithPlayers, error: null }
  } catch (error) {
    return { data: null, error: "Failed to get teams" }
  }
}

export async function getTeamById(teamId: number): Promise<{ data: any | null; error: string | null }> {
  try {
    const teams = getFromSharedStorage<any[]>(SHARED_TEAMS_KEY, [])
    const players = getFromSharedStorage<any[]>(SHARED_PLAYERS_KEY, [])

    const team = teams.find((t) => t.id === teamId)
    if (!team) {
      return { data: null, error: "Team not found" }
    }

    const teamWithPlayers = {
      ...team,
      players: players.filter((player) => player.team_id === teamId),
    }

    return { data: teamWithPlayers, error: null }
  } catch (error) {
    return { data: null, error: "Failed to get team" }
  }
}

export async function createPlayer(
  teamId: number,
  name: string,
  role: PlayerRole,
  sessionId: string,
): Promise<{ data: any | null; error: string | null }> {
  try {
    const players = getFromSharedStorage<any[]>(SHARED_PLAYERS_KEY, [])

    // Check if team exists
    const teams = getFromSharedStorage<any[]>(SHARED_TEAMS_KEY, [])
    const team = teams.find((t) => t.id === teamId)
    if (!team) {
      return { data: null, error: "Team not found" }
    }

    // Check if role is already taken
    const existingPlayer = players.find((p) => p.team_id === teamId && p.role === role)
    if (existingPlayer) {
      return { data: null, error: "Role already taken" }
    }

    const newPlayer = {
      id: generateId(),
      team_id: teamId,
      name,
      role,
      session_id: sessionId,
      is_ready: false,
      created_at: new Date().toISOString(),
    }

    players.push(newPlayer)
    saveToSharedStorage(SHARED_PLAYERS_KEY, players)

    return { data: newPlayer, error: null }
  } catch (error) {
    return { data: null, error: "Failed to create player" }
  }
}

export async function getPlayerBySession(sessionId: string): Promise<{ data: any | null; error: string | null }> {
  try {
    const players = getFromSharedStorage<any[]>(SHARED_PLAYERS_KEY, [])
    const player = players.find((p) => p.session_id === sessionId)

    return { data: player || null, error: null }
  } catch (error) {
    return { data: null, error: "Failed to get player" }
  }
}

export async function updatePlayerReady(playerId: number, isReady: boolean): Promise<{ error: string | null }> {
  try {
    const players = getFromSharedStorage<any[]>(SHARED_PLAYERS_KEY, [])
    const playerIndex = players.findIndex((p) => p.id === playerId)

    if (playerIndex === -1) {
      return { error: "Player not found" }
    }

    players[playerIndex].is_ready = isReady
    saveToSharedStorage(SHARED_PLAYERS_KEY, players)

    return { error: null }
  } catch (error) {
    return { error: "Failed to update player ready status" }
  }
}

export async function createGame(teamId: number) {
  const games = getFromSharedStorage<any[]>(SHARED_GAMES_KEY, [])
  const newGame = {
    id: generateId(),
    team_id: teamId,
    status: "active",
    current_week: 1,
    created_at: new Date().toISOString(),
  }
  games.push(newGame)
  saveToSharedStorage(SHARED_GAMES_KEY, games)
  return { data: newGame, error: null }
}

export async function getGameByTeam(teamId: number) {
  const games = getFromSharedStorage<any[]>(SHARED_GAMES_KEY, [])
  const game = games.find((g) => g.team_id === teamId)
  return { data: game || null, error: null }
}

export async function updateGameStatus(gameId: number, status: string) {
  const games = getFromSharedStorage<any[]>(SHARED_GAMES_KEY, [])
  const gameIndex = games.findIndex((g) => g.id === gameId)
  if (gameIndex !== -1) {
    games[gameIndex].status = status
    saveToSharedStorage(SHARED_GAMES_KEY, games)
  }
  return { error: null }
}

export async function saveGameState() {
  return { error: null }
}

export async function getGameStates() {
  return { data: [], error: null }
}

export async function submitPlayerOrder() {
  return { error: null }
}

export async function getPlayerOrders() {
  return { data: [], error: null }
}

export async function getAllFinishedGames() {
  return { data: [], error: null }
}
