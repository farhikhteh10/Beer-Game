-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('retailer', 'wholesaler', 'distributor', 'factory')),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'playing', 'finished')),
  current_week INTEGER DEFAULT 1,
  total_weeks INTEGER DEFAULT 25,
  initial_inventory INTEGER DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_states table to store weekly game data
CREATE TABLE IF NOT EXISTS game_states (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  retailer_inventory INTEGER DEFAULT 0,
  retailer_backlog INTEGER DEFAULT 0,
  retailer_incoming_shipment INTEGER DEFAULT 0,
  retailer_outgoing_order INTEGER DEFAULT 0,
  retailer_cost DECIMAL(10,2) DEFAULT 0,
  wholesaler_inventory INTEGER DEFAULT 0,
  wholesaler_backlog INTEGER DEFAULT 0,
  wholesaler_incoming_shipment INTEGER DEFAULT 0,
  wholesaler_outgoing_order INTEGER DEFAULT 0,
  wholesaler_cost DECIMAL(10,2) DEFAULT 0,
  distributor_inventory INTEGER DEFAULT 0,
  distributor_backlog INTEGER DEFAULT 0,
  distributor_incoming_shipment INTEGER DEFAULT 0,
  distributor_outgoing_order INTEGER DEFAULT 0,
  distributor_cost DECIMAL(10,2) DEFAULT 0,
  factory_inventory INTEGER DEFAULT 0,
  factory_backlog INTEGER DEFAULT 0,
  factory_incoming_shipment INTEGER DEFAULT 0,
  factory_outgoing_order INTEGER DEFAULT 0,
  factory_cost DECIMAL(10,2) DEFAULT 0,
  customer_demand INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, week)
);

-- Create player_orders table to track individual player orders
CREATE TABLE IF NOT EXISTS player_orders (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  order_quantity INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, player_id, week)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_games_team_id ON games(team_id);
CREATE INDEX IF NOT EXISTS idx_game_states_game_id ON game_states(game_id);
CREATE INDEX IF NOT EXISTS idx_game_states_week ON game_states(week);
CREATE INDEX IF NOT EXISTS idx_player_orders_game_id ON player_orders(game_id);
CREATE INDEX IF NOT EXISTS idx_player_orders_player_id ON player_orders(player_id);
