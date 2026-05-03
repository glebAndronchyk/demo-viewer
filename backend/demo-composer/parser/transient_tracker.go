package parser

import "strconv"

// eventLifecycleMap maps start event type → valid terminator types.
var eventLifecycleMap = map[string][]string{
	"grenade_throw":      {"grenade_destroy", "grenade_he_explode", "grenade_flash_explode", "round_end"},
	"grenade_fire_start": {"grenade_fire_end", "round_end"},
	"bomb_planted":       {"bomb_exploded", "bomb_defused", "round_end"},
	"bomb_defuse_start":  {"bomb_defuse_aborted", "bomb_defused", "round_end"},
}

type transientTracker struct {
	openEvents     map[string]*openTransientEvent
	pendingPatches []TransientEventPatch
	demoID         string
}

func newTransientTracker(demoID string) *transientTracker {
	return &transientTracker{
		openEvents: make(map[string]*openTransientEvent),
		demoID:     demoID,
	}
}

func (t *transientTracker) onStartEvent(key string, evt *openTransientEvent) {
	t.openEvents[key] = evt
}

// onEndEvent closes the open event matching key when terminatorType is a valid terminator for it.
// dataMap is the in-memory data map of the start event (used to patch ended_at directly when not yet flushed).
// Returns true if a matching open event was found and closed.
func (t *transientTracker) onEndEvent(terminatorType, key string, gameTick int, dataMap map[string]interface{}) bool {
	open, ok := t.openEvents[key]
	if !ok {
		return false
	}

	terminators, known := eventLifecycleMap[open.eventType]
	if !known {
		return false
	}

	for _, term := range terminators {
		if term == terminatorType {
			if open.flushed {
				t.pendingPatches = append(t.pendingPatches, TransientEventPatch{
					ChunkIndex: open.chunkIndex,
					FrameIndex: open.frameIndex,
					EventIndex: open.eventIndex,
					EndedAt:    gameTick,
				})
			} else if dataMap != nil {
				dataMap["ended_at"] = gameTick
			}
			delete(t.openEvents, key)
			return true
		}
	}
	return false
}

// onRoundEnd closes all open events using round_end as the terminator.
// dataMaps must map each open event key to its in-memory data map (nil entries trigger patch path).
func (t *transientTracker) onRoundEnd(gameTick int, dataMaps map[string]map[string]interface{}) {
	for key := range t.openEvents {
		var dm map[string]interface{}
		if dataMaps != nil {
			dm = dataMaps[key]
		}
		t.onEndEvent("round_end", key, gameTick, dm)
	}
}

// markFlushed marks all currently open events as flushed with the given chunk/frame coordinates.
// frameIndexOffset is the base frame index within the chunk for events still in buffer.
// Call this just before clearing the frames buffer after a chunk is written.
func (t *transientTracker) markFlushed(chunkIndex int, frameEventIndex map[string][2]int) {
	for key, open := range t.openEvents {
		if !open.flushed {
			if coords, ok := frameEventIndex[key]; ok {
				open.chunkIndex = chunkIndex
				open.frameIndex = coords[0]
				open.eventIndex = coords[1]
				open.flushed = true
			}
		}
	}
}

// roundKey returns the composite key for bomb lifecycle events.
func roundKey(eventType string, roundNumber int) string {
	return eventType + ":round_" + strconv.Itoa(roundNumber)
}

// grenadeKey returns the composite key for grenade lifecycle events.
func grenadeKey(entityID int) string {
	return "grenade:" + strconv.Itoa(entityID)
}
