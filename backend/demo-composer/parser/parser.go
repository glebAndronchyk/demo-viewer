package parser

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	dem "github.com/markus-wa/demoinfocs-golang/v4/pkg/demoinfocs"
	common "github.com/markus-wa/demoinfocs-golang/v4/pkg/demoinfocs/common"
	events "github.com/markus-wa/demoinfocs-golang/v4/pkg/demoinfocs/events"
)

type Parser struct {
	demoFile             string
	framesAmountPerChunk int
	totalChunksProcessed int
	demoID               string
	framesBuffer         []Frame
	currentTick          int
	playerConnections    map[uint64]bool // Track player connection states
}

// NewParser creates a new demo parser
func NewParser(demoFile string, chunkSize int) *Parser {
	return &Parser{
		demoFile:             demoFile,
		framesAmountPerChunk: chunkSize,
		demoID:               uuid.New().String(),
		framesBuffer:         make([]Frame, 0, chunkSize),
		playerConnections:    make(map[uint64]bool),
		totalChunksProcessed: 0,
	}
}

// Parse parses the demo file and returns the complete demo data
func (p *Parser) Parse() (*DemoData, error) {
	f, err := os.Open(p.demoFile)
	if err != nil {
		return nil, fmt.Errorf("failed to open demo file: %w", err)
	}
	defer f.Close()

	parser := dem.NewParser(f)
	defer parser.Close()

	// Get header info
	header, err := parser.ParseHeader()
	if err != nil {
		return nil, fmt.Errorf("failed to parse header: %w", err)
	}
	demoHeader := DemoHeader{
		DemoID:         p.demoID,
		MapName:        header.MapName,
		ServerName:     header.ServerName,
		ClientName:     header.ClientName,
		Duration:       header.PlaybackTime.Seconds(),
		TickRate:       float32(parser.TickRate()),
		FrameRate:      0, // Not directly available in v4
		SignonLength:   header.SignonLength,
		PlaybackTicks:  header.PlaybackTicks,
		PlaybackFrames: header.PlaybackFrames,
		ParsedAt:       time.Now().UTC().Format(time.RFC3339),
	}

	os.Stdout.Write(p.getHeaderAsJson(demoHeader))

	// Register event handlers
	p.registerEventHandlers(parser)

	// Register frame handler to capture state on every tick
	parser.RegisterEventHandler(func(e events.FrameDone) {
		p.captureFrame(parser)

		if len(p.framesBuffer) == p.framesAmountPerChunk {
			os.Stdout.Write(p.getCurrentChunkAsJson(demoHeader))
			p.flushBuffer()
			p.totalChunksProcessed++
		}
	})

	// Parse to end
	err = parser.ParseToEnd()
	if err != nil {
		return nil, fmt.Errorf("failed to parse demo: %w", err)
	}

	// Flush remaining partial chunk
	if len(p.framesBuffer) > 0 {
		os.Stdout.Write(p.getCurrentChunkAsJson(demoHeader))
		p.totalChunksProcessed++
		p.flushBuffer()
	}

	demoParsingSummary := DemoData{
		ChunkSize:   p.framesAmountPerChunk,
		TotalChunks: p.totalChunksProcessed,
	}

	os.Stdout.Write(p.getDemoDataAsJson(demoParsingSummary))

	return &demoParsingSummary, nil
}

// captureFrame captures the game state at the current frame
func (p *Parser) captureFrame(parser dem.Parser) {
	gs := parser.GameState()

	// Calculate timestamp safely to avoid division by zero
	timestamp := 0.0
	tickRate := parser.TickRate()
	if tickRate > 0 {
		timestamp = float64(gs.IngameTick()) / tickRate
	}

	frame := Frame{
		DemoTick:      parser.CurrentFrame(),
		GameTick:      gs.IngameTick(),
		Timestamp:     timestamp,
		PlayerStates:  p.capturePlayerStates(gs),
		GameState:     p.captureGameState(gs),
		Events:        make([]Event, 0),
		Reconnections: make([]Reconnection, 0),
	}

	p.framesBuffer = append(p.framesBuffer, frame)
	p.currentTick = gs.IngameTick()
}

// capturePlayerStates captures all player states
func (p *Parser) capturePlayerStates(gs dem.GameState) []PlayerState {
	participants := gs.Participants().Playing()
	playerStates := make([]PlayerState, 0, len(participants))

	for _, player := range participants {
		if player == nil {
			continue
		}

		playerStates = append(playerStates, p.capturePlayerState(player))
	}

	return playerStates
}

// capturePlayerState captures a single player's state
func (p *Parser) capturePlayerState(player *common.Player) PlayerState {
	pos := player.Position()
	vel := player.Velocity()
	viewDir := player.ViewDirectionX()

	equipment := Equipment{
		ActiveWeapon: "",
		Weapons:      make([]string, 0),
		Grenades:     make([]string, 0),
	}

	if player.ActiveWeapon() != nil {
		equipment.ActiveWeapon = player.ActiveWeapon().String()
	}

	for _, weapon := range player.Weapons() {
		if weapon.Class() >= 400 && weapon.Class() <= 406 {
			// Grenade
			equipment.Grenades = append(equipment.Grenades, weapon.String())
		} else {
			equipment.Weapons = append(equipment.Weapons, weapon.String())
		}
	}

	team := "Unassigned"
	if player.Team == common.TeamTerrorists {
		team = "T"
	} else if player.Team == common.TeamCounterTerrorists {
		team = "CT"
	} else if player.Team == common.TeamSpectators {
		team = "Spectator"
	}

	return PlayerState{
		SteamID64: player.SteamID64,
		Name:      player.Name,
		UserID:    player.UserID,
		Team:      team,
		Position: Vector3{
			X: float64(pos.X),
			Y: float64(pos.Y),
			Z: float64(pos.Z),
		},
		ViewDirection: Vector2{
			X: float64(viewDir),
			Y: float64(player.ViewDirectionY()),
		},
		Velocity: Vector3{
			X: float64(vel.X),
			Y: float64(vel.Y),
			Z: float64(vel.Z),
		},
		HP:               player.Health(),
		Armor:            player.Armor(),
		HasHelmet:        player.HasHelmet(),
		HasDefuseKit:     player.HasDefuseKit(),
		Money:            player.Money(),
		CurrentEquipment: equipment,
		IsAlive:          player.IsAlive(),
		IsBot:            player.IsBot,
		IsConnected:      player.IsConnected,
		IsDucking:        player.IsDucking(),
		IsDefusing:       player.IsDefusing,
		IsPlanting:       player.IsPlanting,
		IsReloading:      player.IsReloading,
		IsScoped:         player.IsScoped(),
		IsWalking:        player.IsWalking(),
		FlashDuration:    player.FlashDuration,
		Kills:            0, // Will be updated through events
		Deaths:           0,
		Assists:          0,
		Score:            0,
		MVPs:             0,
	}
}

// captureGameState captures the overall game state
func (p *Parser) captureGameState(gs dem.GameState) GameState {
	phase := "Unknown"
	switch gs.GamePhase() {
	case common.GamePhaseInit:
		phase = "Init"
	case common.GamePhasePregame:
		phase = "PreGame"
	case common.GamePhaseStartGamePhase:
		phase = "StartGame"
	case common.GamePhaseTeamSideSwitch:
		phase = "TeamSideSwitch"
	case common.GamePhaseGameHalfEnded:
		phase = "GameHalfEnded"
	case common.GamePhaseGameEnded:
		phase = "GameEnded"
	}

	bombSite := ""
	bombTimeRemaining := 0.0
	bombPlanted := false

	bomb := gs.Bomb()
	if bomb != nil && bomb.Carrier == nil {
		// If bomb has no carrier, it's either planted or dropped
		// Check if bomb is planted (position is set and not moving)
		bombPlanted = true
		// Note: Site detection may require additional logic based on bomb position
		// This is a simplified version
	}

	tState := gs.TeamTerrorists()
	ctState := gs.TeamCounterTerrorists()

	return GameState{
		RoundNumber:       gs.TotalRoundsPlayed(),
		Phase:             phase,
		CTScore:           ctState.Score(),
		TScore:            tState.Score(),
		TimeRemaining:     0, // TODO: Calculate from game rules
		BombPlanted:       bombPlanted,
		BombSite:          bombSite,
		BombTimeRemaining: bombTimeRemaining,
	}
}

// addEventToCurrentFrame adds an event to the most recent frame
func (p *Parser) addEventToCurrentFrame(eventType string, data map[string]interface{}) {
	if len(p.framesBuffer) == 0 {
		return
	}

	event := Event{
		Type: eventType,
		Data: data,
	}

	p.framesBuffer[len(p.framesBuffer)-1].Events = append(p.framesBuffer[len(p.framesBuffer)-1].Events, event)
}

// addReconnectionToCurrentFrame adds a reconnection event to the most recent frame
func (p *Parser) addReconnectionToCurrentFrame(steamID uint64, name string, reconnectType string) {
	if len(p.framesBuffer) == 0 {
		return
	}

	reconnection := Reconnection{
		SteamID64:     steamID,
		Name:          name,
		ReconnectType: reconnectType,
	}

	p.framesBuffer[len(p.framesBuffer)-1].Reconnections = append(p.framesBuffer[len(p.framesBuffer)-1].Reconnections, reconnection)
}

// registerEventHandlers registers all event handlers
func (p *Parser) registerEventHandlers(parser dem.Parser) {
	// Player connect/disconnect
	parser.RegisterEventHandler(func(e events.PlayerConnect) {
		if e.Player == nil {
			return
		}

		steamID := e.Player.SteamID64
		if !p.playerConnections[steamID] {
			p.playerConnections[steamID] = true
			p.addReconnectionToCurrentFrame(steamID, e.Player.Name, "connect")
		}

		p.addEventToCurrentFrame("player_connect", map[string]interface{}{
			"steam_id_64": steamID,
			"name":        e.Player.Name,
		})
	})

	parser.RegisterEventHandler(func(e events.PlayerDisconnected) {
		if e.Player == nil {
			return
		}

		steamID := e.Player.SteamID64
		p.playerConnections[steamID] = false
		p.addReconnectionToCurrentFrame(steamID, e.Player.Name, "disconnect")

		p.addEventToCurrentFrame("player_disconnect", map[string]interface{}{
			"steam_id_64": steamID,
			"name":        e.Player.Name,
		})
	})

	// Kill events
	parser.RegisterEventHandler(func(e events.Kill) {
		data := map[string]interface{}{
			"weapon":             e.Weapon.String(),
			"is_headshot":        e.IsHeadshot,
			"penetrated_objects": e.PenetratedObjects,
		}

		if e.Killer != nil {
			data["killer_steam_id_64"] = e.Killer.SteamID64
			data["killer_name"] = e.Killer.Name
		}

		if e.Victim != nil {
			data["victim_steam_id_64"] = e.Victim.SteamID64
			data["victim_name"] = e.Victim.Name
		}

		if e.Assister != nil {
			data["assister_steam_id_64"] = e.Assister.SteamID64
			data["assister_name"] = e.Assister.Name
		}

		p.addEventToCurrentFrame("kill", data)
	})

	// Bomb events
	parser.RegisterEventHandler(func(e events.BombPlanted) {
		site := "Unknown"
		switch e.Site {
		case events.BombsiteA:
			site = "A"
		case events.BombsiteB:
			site = "B"
		}

		data := map[string]interface{}{
			"site": site,
		}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("bomb_planted", data)
	})

	parser.RegisterEventHandler(func(e events.BombDefused) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("bomb_defused", data)
	})

	parser.RegisterEventHandler(func(e events.BombExplode) {
		site := "Unknown"
		switch e.Site {
		case events.BombsiteA:
			site = "A"
		case events.BombsiteB:
			site = "B"
		}

		data := map[string]interface{}{
			"site": site,
		}

		p.addEventToCurrentFrame("bomb_exploded", data)
	})

	parser.RegisterEventHandler(func(e events.BombDefuseStart) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
			data["has_kit"] = e.Player.HasDefuseKit()
		}

		p.addEventToCurrentFrame("bomb_defuse_start", data)
	})

	parser.RegisterEventHandler(func(e events.BombDefuseAborted) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("bomb_defuse_aborted", data)
	})

	// Round events
	parser.RegisterEventHandler(func(e events.RoundStart) {
		p.addEventToCurrentFrame("round_start", map[string]interface{}{
			"time_limit": e.TimeLimit,
			"frag_limit": e.FragLimit,
			"objective":  e.Objective,
		})
	})

	parser.RegisterEventHandler(func(e events.RoundEnd) {
		winner := "Unknown"
		switch e.Winner {
		case common.TeamTerrorists:
			winner = "T"
		case common.TeamCounterTerrorists:
			winner = "CT"
		case common.TeamSpectators:
			winner = "Spectators"
		}

		reason := fmt.Sprintf("%d", e.Reason)

		data := map[string]interface{}{
			"winner": winner,
			"reason": reason,
		}

		p.addEventToCurrentFrame("round_end", data)
	})

	parser.RegisterEventHandler(func(e events.RoundFreezetimeEnd) {
		p.addEventToCurrentFrame("round_freezetime_end", map[string]interface{}{})
	})

	parser.RegisterEventHandler(func(e events.RoundEndOfficial) {
		p.addEventToCurrentFrame("round_end_official", map[string]interface{}{})
	})

	// Weapon events
	parser.RegisterEventHandler(func(e events.WeaponFire) {
		data := map[string]interface{}{
			"weapon": e.Weapon.String(),
		}

		if e.Shooter != nil {
			data["shooter_steam_id_64"] = e.Shooter.SteamID64
			data["shooter_name"] = e.Shooter.Name
		}

		p.addEventToCurrentFrame("weapon_fire", data)
	})

	parser.RegisterEventHandler(func(e events.WeaponReload) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("weapon_reload", data)
	})

	// Damage events
	parser.RegisterEventHandler(func(e events.PlayerHurt) {
		hitGroup := fmt.Sprintf("%d", e.HitGroup)

		data := map[string]interface{}{
			"health_damage": e.HealthDamage,
			"armor_damage":  e.ArmorDamage,
			"weapon":        e.Weapon.String(),
			"hit_group":     hitGroup,
		}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
		}

		if e.Attacker != nil {
			data["attacker_steam_id_64"] = e.Attacker.SteamID64
			data["attacker_name"] = e.Attacker.Name
		}

		p.addEventToCurrentFrame("player_hurt", data)
	})

	// Flashbang events
	parser.RegisterEventHandler(func(e events.PlayerFlashed) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
		}

		if e.Attacker != nil {
			data["attacker_steam_id_64"] = e.Attacker.SteamID64
			data["attacker_name"] = e.Attacker.Name
		}

		p.addEventToCurrentFrame("player_flashed", data)
	})

	// Grenade events
	parser.RegisterEventHandler(func(e events.GrenadeProjectileThrow) {
		data := map[string]interface{}{
			"weapon": e.Projectile.WeaponInstance.String(),
		}

		if e.Projectile.Thrower != nil {
			data["thrower_steam_id_64"] = e.Projectile.Thrower.SteamID64
			data["thrower_name"] = e.Projectile.Thrower.Name
		}

		p.addEventToCurrentFrame("grenade_throw", data)
	})

	parser.RegisterEventHandler(func(e events.GrenadeProjectileDestroy) {
		data := map[string]interface{}{
			"weapon": e.Projectile.WeaponInstance.String(),
		}

		if e.Projectile.Thrower != nil {
			data["thrower_steam_id_64"] = e.Projectile.Thrower.SteamID64
			data["thrower_name"] = e.Projectile.Thrower.Name
		}

		p.addEventToCurrentFrame("grenade_destroy", data)
	})

	// Hostage events (if applicable)
	parser.RegisterEventHandler(func(e events.HostageRescued) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("hostage_rescued", data)
	})

	// Item pickup/drop events
	parser.RegisterEventHandler(func(e events.ItemDrop) {
		data := map[string]interface{}{
			"weapon": e.Weapon.String(),
		}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("item_drop", data)
	})

	parser.RegisterEventHandler(func(e events.ItemPickup) {
		data := map[string]interface{}{
			"weapon": e.Weapon.String(),
		}

		if e.Player != nil {
			data["player_steam_id_64"] = e.Player.SteamID64
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("item_pickup", data)
	})
}

func (p Parser) getCurrentChunkAsJson(header DemoHeader) []byte {
	demoChunk := DemoChunk{
		MessageType:   "chunk",
		DemoID:        header.DemoID,
		ChunkIndex:    p.totalChunksProcessed,
		StartTick:     p.framesBuffer[0].DemoTick,
		EndTick:       p.framesBuffer[len(p.framesBuffer)-1].DemoTick,
		StartGameTick: p.framesBuffer[0].GameTick,
		EndGameTick:   p.framesBuffer[len(p.framesBuffer)-1].GameTick,
		Frames:        p.framesBuffer,
	}

	b, err := json.Marshal(demoChunk)
	if err != nil {
		panic(err)
	}

	return append(b, '\n')
}

func (p Parser) getDemoDataAsJson(data DemoData) []byte {
	data.MessageType = "summary"
	b, err := json.Marshal(data)
	if err != nil {
		panic(err)
	}

	return append(b, '\n')
}

func (p Parser) getHeaderAsJson(header DemoHeader) []byte {
	header.MessageType = "header"
	b, err := json.Marshal(header)
	if err != nil {
		panic(err)
	}

	return append(b, '\n')
}

func (p *Parser) flushBuffer() {
	clear(p.framesBuffer)
	p.framesBuffer = p.framesBuffer[:0]
}
