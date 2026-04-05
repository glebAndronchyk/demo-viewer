package parser

// MatchParticipant is stored in the match document after parsing completes
type MatchParticipant struct {
	SteamID    string `bson:"steam_id,omitempty"`
	PlayerName string `bson:"player_name"`
	IsBot      bool   `bson:"is_bot"`
}

// ParticipantInfo contains identity information about a player (not per-tick state)
type ParticipantInfo struct {
	SteamID64 uint64 `bson:"steam_id_64" json:"steam_id_64"`
	Name      string `bson:"name" json:"name"`
	IsBot     bool   `bson:"is_bot" json:"is_bot"`
}

// DemoData represents the complete demo file parsed data for JSON export
type DemoData struct {
	MessageType  string            `bson:"message_type" json:"message_type"`
	DemoID       string            `json:"demo_id"`
	ChunkSize    int               `json:"chunk_size"`
	TotalChunks  int               `json:"total_chunks"`
	Participants []ParticipantInfo `json:"participants"`
}

// DemoChunk represents a chunk of frames for MongoDB storage
// This structure is used when storing in MongoDB with compression
type DemoChunk struct {
	MessageType   string  `bson:"message_type" json:"message_type"`
	DemoID        string  `bson:"demo_id" json:"demo_id"`                 // Unique demo identifier
	ChunkIndex    int     `bson:"chunk_index" json:"chunk_index"`         // Chunk number (0-based)
	StartTick     int     `bson:"start_tick" json:"start_tick"`           // First tick in this chunk
	EndTick       int     `bson:"end_tick" json:"end_tick"`               // Last tick in this chunk
	StartGameTick int     `bson:"start_game_tick" json:"start_game_tick"` // First game tick
	EndGameTick   int     `bson:"end_game_tick" json:"end_game_tick"`     // Last game tick
	Frames        []Frame `bson:"frames" json:"frames"`                   // Actual frame data
}

// DemoHeader contains metadata about the demo file
type DemoHeader struct {
	MessageType    string  `bson:"message_type" json:"message_type"` // Unique identifier for this demo
	DemoID         string  `bson:"demo_id" json:"demo_id"`           // Unique identifier for this demo
	MapName        string  `bson:"map_name" json:"map_name"`
	ServerName     string  `bson:"server_name" json:"server_name"`
	ClientName     string  `bson:"client_name" json:"client_name"`
	Duration       float64 `bson:"duration" json:"duration"`
	TickRate       float32 `bson:"tick_rate" json:"tick_rate"`
	FrameRate      float32 `bson:"frame_rate" json:"frame_rate"`
	SignonLength   int     `bson:"signon_length" json:"signon_length"`
	PlaybackTicks  int     `bson:"playback_ticks" json:"playback_ticks"`
	PlaybackFrames int     `bson:"playback_frames" json:"playback_frames"`
	ParsedAt       string  `bson:"parsed_at" json:"parsed_at"` // ISO timestamp when parsed
}

// Frame represents a single frame/tick in the demo with all associated data
type Frame struct {
	DemoTick      int            `bson:"demo_tick" json:"demo_tick"`
	GameTick      int            `bson:"game_tick" json:"game_tick"`
	Timestamp     float64        `bson:"timestamp" json:"timestamp"`
	PlayerStates  []PlayerState  `bson:"player_states" json:"player_states"`
	GameState     GameState      `bson:"game_state" json:"game_state"`
	Events        []Event        `bson:"events" json:"events"`
	Reconnections []Reconnection `bson:"reconnections,omitempty" json:"reconnections,omitempty"`
}

// PlayerState represents a player's state at a specific tick
type PlayerState struct {
	SteamID64        uint64    `bson:"steam_id_64" json:"steam_id_64"`
	Name             string    `bson:"name" json:"name"`
	UserID           int       `bson:"user_id" json:"user_id"`
	Team             string    `bson:"team" json:"team"`
	Position         Vector3   `bson:"position" json:"position"`
	ViewDirection    Vector2   `bson:"view_direction" json:"view_direction"` // Yaw, Pitch
	Velocity         Vector3   `bson:"velocity" json:"velocity"`
	HP               int       `bson:"hp" json:"hp"`
	Armor            int       `bson:"armor" json:"armor"`
	HasHelmet        bool      `bson:"has_helmet" json:"has_helmet"`
	HasDefuseKit     bool      `bson:"has_defuse_kit" json:"has_defuse_kit"`
	Money            int       `bson:"money" json:"money"`
	CurrentEquipment Equipment `bson:"current_equipment" json:"current_equipment"`
	IsAlive          bool      `bson:"is_alive" json:"is_alive"`
	IsBot            bool      `bson:"is_bot" json:"is_bot"`
	IsConnected      bool      `bson:"is_connected" json:"is_connected"`
	IsDucking        bool      `bson:"is_ducking" json:"is_ducking"`
	IsDefusing       bool      `bson:"is_defusing" json:"is_defusing"`
	IsPlanting       bool      `bson:"is_planting" json:"is_planting"`
	IsReloading      bool      `bson:"is_reloading" json:"is_reloading"`
	IsScoped         bool      `bson:"is_scoped" json:"is_scoped"`
	IsWalking        bool      `bson:"is_walking" json:"is_walking"`
	FlashDuration    float32   `bson:"flash_duration" json:"flash_duration"`
	Kills            int       `bson:"kills" json:"kills"`
	Deaths           int       `bson:"deaths" json:"deaths"`
	Assists          int       `bson:"assists" json:"assists"`
	Score            int       `bson:"score" json:"score"`
	MVPs             int       `bson:"mvps" json:"mvps"`
}

// Vector3 represents a 3D position or velocity
type Vector3 struct {
	X float64 `bson:"x" json:"x"`
	Y float64 `bson:"y" json:"y"`
	Z float64 `bson:"z" json:"z"`
}

// Vector2 represents view angles
type Vector2 struct {
	X float64 `bson:"x" json:"x"`
	Y float64 `bson:"y" json:"y"`
}

// Equipment represents player's current equipment
type Equipment struct {
	ActiveWeapon string   `bson:"active_weapon" json:"active_weapon"`
	Weapons      []string `bson:"weapons" json:"weapons"`
	Grenades     []string `bson:"grenades" json:"grenades"`
}

// GameState represents the overall game state at a specific tick
type GameState struct {
	RoundNumber       int     `bson:"round_number" json:"round_number"`
	Phase             string  `bson:"phase" json:"phase"`
	CTScore           int     `bson:"ct_score" json:"ct_score"`
	TScore            int     `bson:"t_score" json:"t_score"`
	TimeRemaining     float64 `bson:"time_remaining" json:"time_remaining"`
	BombPlanted       bool    `bson:"bomb_planted" json:"bomb_planted"`
	BombSite          string  `bson:"bomb_site,omitempty" json:"bomb_site,omitempty"`
	BombTimeRemaining float64 `bson:"bomb_time_remaining" json:"bomb_time_remaining"`
}

// Event represents any game event at a specific tick
type Event struct {
	Type string                 `bson:"type" json:"type"`
	Data map[string]interface{} `bson:"data" json:"data"`
}

// Reconnection represents a player connection/disconnection event at a specific tick
type Reconnection struct {
	SteamID64     uint64 `bson:"steam_id_64" json:"steam_id_64"`
	Name          string `bson:"name" json:"name"`
	ReconnectType string `bson:"reconnect_type" json:"reconnect_type"` // "connect" or "disconnect"
}
