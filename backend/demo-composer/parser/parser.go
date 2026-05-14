package parser

import (
	"compress/bzip2"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	dem "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/common"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/events"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/msg"
)

// Its better to use different collections in database to reduce physical space per demo.
// Data in demo is very repetitive and can be quantized. We dont need positions tracking in each frame and chunk,
// events can be stored as separate dynamic object, not in the per frame order.
// We should also introduce a snapshotting system to properly find per tick difference and reconstruct the history between the,
type roundStart struct {
	demoTick int
	gameTick int
}

type Parser struct {
	demoFile             string
	demoUrl              string
	framesAmountPerChunk int
	totalChunksProcessed int
	demoID               string
	shareCode            string
	framesBuffer         []Frame
	currentTick          int
	playerConnections    map[uint64]bool
	participantsSeen     map[uint64]ParticipantInfo
	repo                 *Repository
	rounds               []RoundInfo
	currentRoundStart    roundStart
	currentRoundNumber   int
	tracker              *transientTracker
	// openEventDataMaps maps transient tracker key → in-memory data map for unflushed events
	openEventDataMaps map[string]map[string]interface{}
}

func (p *Parser) IsLocalParse() bool {
	return len(p.demoFile) > 0
}

func (p *Parser) IsRemoteParse() bool {
	return len(p.demoUrl) > 0
}

// NewParser creates a new demo parser
func NewParser(demoFile string, demoUrl string, chunkSize int, shareCode string, repo *Repository) *Parser {
	demoID := uuid.New().String()
	return &Parser{
		demoFile:             demoFile,
		demoUrl:              demoUrl,
		framesAmountPerChunk: chunkSize,
		demoID:               demoID,
		shareCode:            shareCode,
		framesBuffer:         make([]Frame, 0, chunkSize),
		playerConnections:    make(map[uint64]bool),
		participantsSeen:     make(map[uint64]ParticipantInfo),
		totalChunksProcessed: 0,
		repo:                 repo,
		rounds:               make([]RoundInfo, 0),
		currentRoundNumber:   0,
		tracker:              newTransientTracker(demoID),
		openEventDataMaps:    make(map[string]map[string]interface{}),
	}
}

func (p *Parser) currentGameTick() int {
	if len(p.framesBuffer) == 0 {
		return 0
	}
	return p.framesBuffer[len(p.framesBuffer)-1].GameTick
}

// startTransientEvent registers a start event with the tracker and records its in-memory data map.
func (p *Parser) startTransientEvent(key, eventType string, data map[string]interface{}) {
	if len(p.framesBuffer) == 0 {
		return
	}
	frameIdx := len(p.framesBuffer) - 1
	eventIdx := len(p.framesBuffer[frameIdx].Events) - 1
	p.tracker.onStartEvent(key, &openTransientEvent{
		eventType:  eventType,
		startedAt:  p.currentGameTick(),
		chunkIndex: -1,
		frameIndex: frameIdx,
		eventIndex: eventIdx,
		flushed:    false,
	})
	p.openEventDataMaps[key] = data
}

// endTransientEvent closes an open transient event by key.
func (p *Parser) endTransientEvent(terminatorType, key string) {
	dm := p.openEventDataMaps[key]
	if p.tracker.onEndEvent(terminatorType, key, p.currentGameTick(), dm) {
		delete(p.openEventDataMaps, key)
	}
}

// Parse parses the demo file and persists data to MongoDB
func (p *Parser) Parse() error {
	var reader io.Reader = nil

	if p.IsRemoteParse() {
		rc, err := p.openUrlReader(p.demoUrl)
		if err != nil {
			return err
		}
		defer rc.Close()
		reader = rc
	} else if p.IsLocalParse() {
		rc, err := p.openFileReader(p.demoFile)
		if err != nil {
			return err
		}
		defer rc.Close()
		reader = rc
	}

	parser := dem.NewParser(reader)
	defer parser.Close()

	demoHeader := DemoHeader{
		DemoID:    p.demoID,
		ShareCode: p.shareCode,
		ParsedAt:  time.Now().UTC().Format(time.RFC3339),
	}

	if err := p.repo.InsertMatch(demoHeader); err != nil {
		return fmt.Errorf("failed to insert match: %w", err)
	}

	var chunksBatch []DemoChunk

	flushBatch := func() error {
		if err := p.repo.InsertChunkBatch(p.demoID, chunksBatch); err != nil {
			return fmt.Errorf("failed to insert chunk batch: %w", err)
		}
		chunksBatch = chunksBatch[:0]
		return nil
	}

	// Capture map name from server info message (replaces v4 ParseHeader/Header API)
	var mapName string
	parser.RegisterNetMessageHandler(func(m *msg.CSVCMsg_ServerInfo) {
		mapName = m.GetMapName()
	})

	// Register event handlers
	p.registerEventHandlers(parser)

	var frameErr error

	// Register frame handler to capture state on every tick
	parser.RegisterEventHandler(func(e events.FrameDone) {
		if frameErr != nil {
			return
		}
		p.captureFrame(parser)

		if len(p.framesBuffer) == p.framesAmountPerChunk {
			// Build frame+event index for open events before flushing
			frameEventIndex := p.buildFrameEventIndex()

			chunk := DemoChunk{
				MessageType:   "chunk",
				ChunkIndex:    p.totalChunksProcessed,
				StartTick:     p.framesBuffer[0].DemoTick,
				EndTick:       p.framesBuffer[len(p.framesBuffer)-1].DemoTick,
				StartGameTick: p.framesBuffer[0].GameTick,
				EndGameTick:   p.framesBuffer[len(p.framesBuffer)-1].GameTick,
				Frames:        append([]Frame(nil), p.framesBuffer...),
			}
			chunksBatch = append(chunksBatch, chunk)
			p.tracker.markFlushed(p.totalChunksProcessed, frameEventIndex)
			p.flushBuffer()
			p.totalChunksProcessed++

			if len(chunksBatch) >= 50 {
				if err := flushBatch(); err != nil {
					frameErr = err
				}
			}
		}
	})

	if err := parser.ParseToEnd(); err != nil {
		return fmt.Errorf("failed to parse demo: %w", err)
	}

	if frameErr != nil {
		return frameErr
	}

	// Collect metadata available after full parse.
	// ServerName, ClientName, SignonLength are not available in demoinfocs-golang v5.
	demoHeader.MapName = mapName
	demoHeader.Duration = parser.CurrentTime().Seconds()
	demoHeader.TickRate = float32(parser.TickRate())
	demoHeader.PlaybackFrames = parser.CurrentFrame()
	demoHeader.PlaybackTicks = parser.GameState().IngameTick()
	if demoHeader.Duration > 0 {
		demoHeader.FrameRate = float32(float64(demoHeader.PlaybackFrames) / demoHeader.Duration)
	}

	finalGS := parser.GameState()
	tScore := finalGS.TeamTerrorists().Score()
	ctScore := finalGS.TeamCounterTerrorists().Score()
	outcomeWinner := "Draw"
	if tScore > ctScore {
		outcomeWinner = "T"
	} else if ctScore > tScore {
		outcomeWinner = "CT"
	}
	demoHeader.Rounds = p.rounds
	demoHeader.Outcome = MatchOutcome{
		Winner:  outcomeWinner,
		TScore:  tScore,
		CTScore: ctScore,
	}

	// Flush remaining partial chunk
	if len(p.framesBuffer) > 0 {
		frameEventIndex := p.buildFrameEventIndex()

		chunk := DemoChunk{
			MessageType:   "chunk",
			ChunkIndex:    p.totalChunksProcessed,
			StartTick:     p.framesBuffer[0].DemoTick,
			EndTick:       p.framesBuffer[len(p.framesBuffer)-1].DemoTick,
			StartGameTick: p.framesBuffer[0].GameTick,
			EndGameTick:   p.framesBuffer[len(p.framesBuffer)-1].GameTick,
			Frames:        append([]Frame(nil), p.framesBuffer...),
		}
		chunksBatch = append(chunksBatch, chunk)
		p.tracker.markFlushed(p.totalChunksProcessed, frameEventIndex)
		p.totalChunksProcessed++
		p.flushBuffer()
	}

	if err := flushBatch(); err != nil {
		return err
	}

	if err := p.repo.PatchTransientEventEndedAt(p.demoID, p.tracker.pendingPatches); err != nil {
		return fmt.Errorf("failed to patch transient events: %w", err)
	}

	matchParticipants := make([]MatchParticipant, 0, len(p.participantsSeen))
	for _, info := range p.participantsSeen {
		mp := MatchParticipant{
			PlayerName: info.Name,
			IsBot:      info.IsBot,
		}
		if !info.IsBot {
			mp.SteamID = info.SteamID64
		}
		matchParticipants = append(matchParticipants, mp)
	}

	if err := p.repo.FinalizeMatch(p.demoID, p.totalChunksProcessed, matchParticipants); err != nil {
		return fmt.Errorf("failed to finalize match: %w", err)
	}

	if err := p.repo.UpdateMatchMetadata(p.demoID, demoHeader); err != nil {
		return fmt.Errorf("failed to update match metadata: %w", err)
	}

	return nil
}

func (p Parser) openFileReader(fsPath string) (io.ReadCloser, error) {
	f, err := os.Open(fsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open demo file: %w", err)
	}
	return f, nil
}

func (p Parser) openUrlReader(url string) (io.ReadCloser, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to open demo url: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("unexpected status %d fetching demo url", resp.StatusCode)
	}
	if strings.HasSuffix(url, ".bz2") {
		return struct {
			io.Reader
			io.Closer
		}{bzip2.NewReader(resp.Body), resp.Body}, nil
	}
	return resp.Body, nil
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

		if _, exists := p.participantsSeen[player.SteamID64]; !exists {
			p.participantsSeen[player.SteamID64] = ParticipantInfo{
				SteamID64: strconv.FormatUint(player.SteamID64, 10),
				Name:      player.Name,
				IsBot:     player.IsBot,
			}
		}

		playerStates = append(playerStates, p.capturePlayerState(player))
	}

	return playerStates
}

// capturePlayerState captures a single player's state
func (p *Parser) capturePlayerState(player *common.Player) PlayerState {
	pos := player.Position()
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
		SteamID64: strconv.FormatUint(player.SteamID64, 10),
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
		Velocity: Vector3{X: 0, Y: 0, Z: 0},
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
		Kills:            player.Kills(),
		Deaths:           player.Deaths(),
		Assists:          player.Assists(),
		Score:            player.Score(),
		MVPs:             player.MVPs(),
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
		RoundNumber:       p.currentRoundNumber,
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
		SteamID64:     strconv.FormatUint(steamID, 10),
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
			"steam_id_64": strconv.FormatUint(steamID, 10),
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
			"steam_id_64": strconv.FormatUint(steamID, 10),
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
			data["killer_steam_id_64"] = strconv.FormatUint(e.Killer.SteamID64, 10)
			data["killer_name"] = e.Killer.Name
		}

		if e.Victim != nil {
			data["victim_steam_id_64"] = strconv.FormatUint(e.Victim.SteamID64, 10)
			data["victim_name"] = e.Victim.Name
		}

		if e.Assister != nil {
			data["assister_steam_id_64"] = strconv.FormatUint(e.Assister.SteamID64, 10)
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
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("bomb_planted", data)
		p.startTransientEvent(roundKey("bomb_planted", p.currentRoundNumber), "bomb_planted", data)
	})

	parser.RegisterEventHandler(func(e events.BombDefused) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("bomb_defused", data)
		p.endTransientEvent("bomb_defused", roundKey("bomb_planted", p.currentRoundNumber))
		p.endTransientEvent("bomb_defused", roundKey("bomb_defuse_start", p.currentRoundNumber))
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
		p.endTransientEvent("bomb_exploded", roundKey("bomb_planted", p.currentRoundNumber))
	})

	parser.RegisterEventHandler(func(e events.BombDefuseStart) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
			data["has_kit"] = e.Player.HasDefuseKit()
		}

		p.addEventToCurrentFrame("bomb_defuse_start", data)
		p.startTransientEvent(roundKey("bomb_defuse_start", p.currentRoundNumber), "bomb_defuse_start", data)
	})

	parser.RegisterEventHandler(func(e events.BombDefuseAborted) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("bomb_defuse_aborted", data)
		p.endTransientEvent("bomb_defuse_aborted", roundKey("bomb_defuse_start", p.currentRoundNumber))
	})

	// Round events
	parser.RegisterEventHandler(func(e events.RoundStart) {
		p.currentRoundNumber++
		p.currentRoundStart = roundStart{
			demoTick: parser.CurrentFrame(),
			gameTick: parser.GameState().IngameTick(),
		}
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

		endDemoTick := parser.CurrentFrame()
		endGameTick := parser.GameState().IngameTick()

		p.rounds = append(p.rounds, RoundInfo{
			RoundNumber:   p.currentRoundNumber,
			Winner:        winner,
			StartDemoTick: p.currentRoundStart.demoTick,
			EndDemoTick:   endDemoTick,
			StartGameTick: p.currentRoundStart.gameTick,
			EndGameTick:   endGameTick,
		})

		// Close all open transient events before adding the round_end frame event
		p.tracker.onRoundEnd(endGameTick, p.openEventDataMaps)
		// Remove closed keys from openEventDataMaps
		for key := range p.openEventDataMaps {
			if _, stillOpen := p.tracker.openEvents[key]; !stillOpen {
				delete(p.openEventDataMaps, key)
			}
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
			"weapon":    e.Weapon.String(),
			"direction": Vector3{X: 0, Y: 0, Z: 0},
		}

		if e.Shooter != nil {
			data["shooter_steam_id_64"] = strconv.FormatUint(e.Shooter.SteamID64, 10)
			data["shooter_name"] = e.Shooter.Name
			yaw := float64(e.Shooter.ViewDirectionX()) * math.Pi / 180
			pitch := float64(e.Shooter.ViewDirectionY()) * math.Pi / 180
			data["direction"] = Vector3{
				X: math.Cos(pitch) * math.Cos(yaw), // basic formula
				Y: math.Cos(pitch) * math.Sin(yaw), // math.Cos(pitch) shrink the component
				Z: -math.Sin(pitch),
			}
		}

		p.addEventToCurrentFrame("weapon_fire", data)
	})

	parser.RegisterEventHandler(func(e events.WeaponReload) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
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
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
		}

		if e.Attacker != nil {
			data["attacker_steam_id_64"] = strconv.FormatUint(e.Attacker.SteamID64, 10)
			data["attacker_name"] = e.Attacker.Name
		}

		p.addEventToCurrentFrame("player_hurt", data)
	})

	// Flashbang events
	parser.RegisterEventHandler(func(e events.PlayerFlashed) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
			data["player_team"] = e.Player.Team
		}

		data["flash_duration"] = float32(e.FlashDuration().Milliseconds())

		if e.Attacker != nil {
			data["attacker_steam_id_64"] = strconv.FormatUint(e.Attacker.SteamID64, 10)
			data["attacker_name"] = e.Attacker.Name
			data["attacker_team"] = e.Attacker.Team
		}

		p.addEventToCurrentFrame("player_flashed", data)
	})

	// Grenade events
	parser.RegisterEventHandler(func(e events.GrenadeProjectileThrow) {
		data := map[string]interface{}{
			"weapon": e.Projectile.WeaponInstance.String(),
		}

		pos := e.Projectile.Position()

		entityID := e.Projectile.Entity.ID()
		data["grenade_entity_id"] = entityID
		data["grenade_position"] = Vector3{
			X: float64(pos.X),
			Y: float64(pos.Y),
			Z: float64(pos.Z),
		}

		if e.Projectile.Thrower != nil {
			data["thrower_steam_id_64"] = strconv.FormatUint(e.Projectile.Thrower.SteamID64, 10)
			data["thrower_name"] = e.Projectile.Thrower.Name
		}

		p.addEventToCurrentFrame("grenade_throw", data)
		p.startTransientEvent(grenadeKey(entityID), "grenade_throw", data)
	})

	parser.RegisterEventHandler(func(e events.GrenadeProjectileDestroy) {
		data := map[string]interface{}{
			"weapon": e.Projectile.WeaponInstance.String(),
		}

		pos := e.Projectile.Position()

		entityID := e.Projectile.Entity.ID()
		data["grenade_entity_id"] = entityID
		data["grenade_position"] = Vector3{
			X: float64(pos.X),
			Y: float64(pos.Y),
			Z: float64(pos.Z),
		}

		if e.Projectile.Thrower != nil {
			data["thrower_steam_id_64"] = strconv.FormatUint(e.Projectile.Thrower.SteamID64, 10)
			data["thrower_name"] = e.Projectile.Thrower.Name
		}

		p.addEventToCurrentFrame("grenade_destroy", data)
		p.endTransientEvent("grenade_destroy", grenadeKey(entityID))
	})

	parser.RegisterEventHandler(func(e events.FireGrenadeStart) {
		data := map[string]interface{}{}
		pos := e.Position

		data["grenade_type"] = e.GrenadeType.String()
		data["grenade_entity_id"] = e.GrenadeEntityID
		data["grenade_position"] = Vector3{
			X: float64(pos.X),
			Y: float64(pos.Y),
			Z: float64(pos.Z),
		}

		if e.Thrower != nil {
			data["thrower_steam_id_64"] = strconv.FormatUint(e.Thrower.SteamID64, 10)
			data["thrower_name"] = e.Thrower.Name
		}

		p.addEventToCurrentFrame("grenade_fire_start", data)
		p.startTransientEvent(grenadeKey(e.GrenadeEntityID), "grenade_fire_start", data)
	})

	parser.RegisterEventHandler(func(e events.FireGrenadeExpired) {
		data := map[string]interface{}{}
		pos := e.Position

		data["grenade_type"] = e.GrenadeType.String()
		data["grenade_entity_id"] = e.GrenadeEntityID
		data["grenade_position"] = Vector3{
			X: float64(pos.X),
			Y: float64(pos.Y),
			Z: float64(pos.Z),
		}

		if e.Thrower != nil {
			data["thrower_steam_id_64"] = strconv.FormatUint(e.Thrower.SteamID64, 10)
			data["thrower_name"] = e.Thrower.Name
		}

		p.addEventToCurrentFrame("grenade_fire_end", data)
		p.endTransientEvent("grenade_fire_end", grenadeKey(e.GrenadeEntityID))
	})

	parser.RegisterEventHandler(func(e events.HeExplode) {
		data := map[string]interface{}{}
		pos := e.Position

		data["grenade_type"] = e.GrenadeType.String()
		data["grenade_entity_id"] = e.GrenadeEntityID
		data["grenade_position"] = Vector3{
			X: float64(pos.X),
			Y: float64(pos.Y),
			Z: float64(pos.Z),
		}

		if e.Thrower != nil {
			data["thrower_steam_id_64"] = strconv.FormatUint(e.Thrower.SteamID64, 10)
			data["thrower_name"] = e.Thrower.Name
		}

		p.addEventToCurrentFrame("grenade_he_explode", data)
		p.endTransientEvent("grenade_he_explode", grenadeKey(e.GrenadeEntityID))
	})

	parser.RegisterEventHandler(func(e events.FlashExplode) {
		data := map[string]interface{}{}
		pos := e.Position

		data["grenade_type"] = e.GrenadeType.String()
		data["grenade_entity_id"] = e.GrenadeEntityID
		data["grenade_position"] = Vector3{
			X: float64(pos.X),
			Y: float64(pos.Y),
			Z: float64(pos.Z),
		}

		if e.Thrower != nil {
			data["thrower_steam_id_64"] = strconv.FormatUint(e.Thrower.SteamID64, 10)
			data["thrower_name"] = e.Thrower.Name
		}

		p.addEventToCurrentFrame("grenade_flash_explode", data)
		p.endTransientEvent("grenade_flash_explode", grenadeKey(e.GrenadeEntityID))
	})

	// Hostage events (if applicable)
	parser.RegisterEventHandler(func(e events.HostageRescued) {
		data := map[string]interface{}{}

		if e.Player != nil {
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("hostage_rescued", data)
	})

	// Item pickup/drop events
	parser.RegisterEventHandler(func(e events.ItemDrop) {
		data := map[string]interface{}{
			"weapon": e.Weapon.String(),
		}

		if e.Weapon != nil {
			data["weapon_entity_id"] = e.Weapon.UniqueID2().String()
		}

		if e.Player != nil {
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("item_drop", data)
	})

	parser.RegisterEventHandler(func(e events.ItemPickup) {
		data := map[string]interface{}{
			"weapon":    e.Weapon.String(),
			"is_bought": false,
		}

		if e.Weapon != nil {
			data["weapon_entity_id"] = e.Weapon.UniqueID2().String()
		}

		if e.Player != nil {
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
			data["is_bought"] = e.Player.IsInBuyZone()
		}

		p.addEventToCurrentFrame("item_pickup", data)
	})

	parser.RegisterEventHandler(func(e events.ItemRefund) {
		data := map[string]interface{}{
			"weapon": e.Weapon.String(),
		}

		if e.Weapon != nil {
			data["weapon_entity_id"] = e.Weapon.UniqueID2().String()
		}

		if e.Player != nil {
			data["player_steam_id_64"] = strconv.FormatUint(e.Player.SteamID64, 10)
			data["player_name"] = e.Player.Name
		}

		p.addEventToCurrentFrame("item_refund", data)
	})
}

func (p *Parser) flushBuffer() {
	clear(p.framesBuffer)
	p.framesBuffer = p.framesBuffer[:0]
}

// buildFrameEventIndex scans open events that are still in the buffer and returns their
// frame+event coordinates so markFlushed can record them before the buffer is cleared.
func (p *Parser) buildFrameEventIndex() map[string][2]int {
	index := make(map[string][2]int)
	for key, open := range p.tracker.openEvents {
		if !open.flushed {
			index[key] = [2]int{open.frameIndex, open.eventIndex}
		}
	}
	return index
}
