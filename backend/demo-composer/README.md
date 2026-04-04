# CS2 Demo Parser

A Go package for parsing CS2 (Counter-Strike 2) demo files into comprehensive JSON format with support for MongoDB storage with chunking and compression.

## Features

- **Complete Frame Capture**: Captures game state on every frame and tick (both demo and game ticks)
- **Player Positions**: Tracks all player positions, velocities, view directions, and states
- **All Events**: Captures all game events including:
  - Kills, deaths, assists
  - Bomb plant/defuse/explode
  - Weapon fire and reload
  - Player damage and flashing
  - Grenade throws and detonations
  - Item pickup/drop
  - Round start/end
  - And more...
- **Reconnection Tracking**: Tracks player connections and disconnections
- **MongoDB Ready**: Designed for efficient MongoDB storage with:
  - Configurable chunk sizes
  - Compression support
  - Query-optimized structure for sequential tick ranges

## Installation

```bash
go get github.com/markus-wa/demoinfocs-golang/v4
go get github.com/google/uuid
```

## Usage

### As a Command-Line Tool

Build the binary:

```bash
go build -o cs2-demo-parser ./cmd/main.go
```

Run the parser:

```bash
# Basic usage
./cs2-demo-parser -demo match.dem

# Specify output file
./cs2-demo-parser -demo match.dem -output result.json

# With compression
./cs2-demo-parser -demo match.dem -compress

# Custom chunk size for MongoDB
./cs2-demo-parser -demo match.dem -chunk-size 500
```

### As a Go Package

```go
package main

import (
    "log"
    "cs2-demo-parser/parser"
)

func main() {
    // Create parser with chunk size of 1000 frames
    p := parser.NewParser("match.dem", 1000)

    // Parse the demo
    demoData, err := p.Parse()
    if err != nil {
        log.Fatal(err)
    }

    // Export to JSON
    err = parser.ExportToJSON(demoData, "output.json")
    if err != nil {
        log.Fatal(err)
    }

    // Or export compressed
    err = parser.ExportToJSONGzip(demoData, "output.json.gz")
    if err != nil {
        log.Fatal(err)
    }
}
```

### MongoDB Integration

The package is designed for efficient MongoDB storage with sequential chunk querying:

```go
package main

import (
    "context"
    "log"
    "cs2-demo-parser/parser"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
    // Parse demo
    p := parser.NewParser("match.dem", 1000) // 1000 frames per chunk
    demoData, err := p.Parse()
    if err != nil {
        log.Fatal(err)
    }

    // Connect to MongoDB
    client, err := mongo.Connect(context.Background(), options.Client().ApplyURI("mongodb://localhost:27017"))
    if err != nil {
        log.Fatal(err)
    }
    defer client.Disconnect(context.Background())

    db := client.Database("cs2demos")

    // Store header
    headersCol := db.Collection("demo_headers")
    _, err = headersCol.InsertOne(context.Background(), demoData.Header)
    if err != nil {
        log.Fatal(err)
    }

    // Get chunks and store them
    chunks := parser.GetChunks(demoData)
    chunksCol := db.Collection("demo_chunks")

    for i := range chunks {
        // Optionally compress each chunk
        err = parser.CompressChunk(&chunks[i])
        if err != nil {
            log.Printf("Failed to compress chunk %d: %v", i, err)
            continue
        }

        _, err = chunksCol.InsertOne(context.Background(), chunks[i])
        if err != nil {
            log.Printf("Failed to insert chunk %d: %v", i, err)
        }
    }

    log.Printf("Stored %d chunks in MongoDB", len(chunks))
}
```

### Querying Chunks from MongoDB

```go
// Query specific tick range (e.g., ticks 1-10)
filter := bson.M{
    "demo_id": "your-demo-id",
    "start_tick": bson.M{"$lte": 10},
    "end_tick": bson.M{"$gte": 1},
}

cursor, err := chunksCol.Find(context.Background(), filter)
if err != nil {
    log.Fatal(err)
}
defer cursor.Close(context.Background())

var chunks []parser.DemoChunk
err = cursor.All(context.Background(), &chunks)
if err != nil {
    log.Fatal(err)
}
```

## Data Structure

### Frame Structure

Each frame contains:

```json
{
  "demo_tick": 12345,
  "game_tick": 10000,
  "timestamp": 125.5,
  "player_states": [
    {
      "steam_id_64": 76561198012345678,
      "name": "PlayerName",
      "team": "T",
      "position": {"x": 100.5, "y": 200.3, "z": 64.0},
      "view_direction": {"x": 45.5, "y": 10.2},
      "velocity": {"x": 250.0, "y": 0.0, "z": 0.0},
      "hp": 100,
      "armor": 100,
      "current_equipment": {
        "active_weapon": "AK-47",
        "weapons": ["AK-47", "Glock-18"],
        "grenades": ["Smoke Grenade", "Flashbang"]
      },
      "is_alive": true,
      "is_ducking": false,
      ...
    }
  ],
  "game_state": {
    "round_number": 5,
    "phase": "Live",
    "ct_score": 2,
    "t_score": 2,
    "bomb_planted": false
  },
  "events": [
    {
      "type": "kill",
      "data": {
        "killer_steam_id_64": 76561198012345678,
        "killer_name": "Player1",
        "victim_steam_id_64": 76561198087654321,
        "victim_name": "Player2",
        "weapon": "AK-47",
        "is_headshot": true
      }
    }
  ],
  "reconnections": []
}
```

### Captured Events

- **Player Events**: connect, disconnect, hurt, flashed, kill
- **Bomb Events**: planted, defused, exploded, defuse_start, defuse_aborted
- **Round Events**: round_start, round_end, round_freezetime_end, round_end_official
- **Weapon Events**: weapon_fire, weapon_reload
- **Item Events**: item_pickup, item_drop
- **Grenade Events**: grenade_throw, grenade_destroy
- **Hostage Events**: hostage_rescued (if applicable)

## MongoDB Schema Recommendations

### Collections

1. **demo_headers**: Store demo metadata
   - Index: `demo_id` (unique)

2. **demo_chunks**: Store frame chunks
   - Indexes:
     - `demo_id` + `chunk_index` (compound, unique)
     - `demo_id` + `start_tick` + `end_tick` (compound)
     - `demo_id` + `start_game_tick` + `end_game_tick` (compound)

### Query Patterns

```javascript
// Query by demo tick range
db.demo_chunks.find({
  "demo_id": "abc123",
  "start_tick": { $lte: 100 },
  "end_tick": { $gte: 1 }
}).sort({ chunk_index: 1 })

// Query by game tick range
db.demo_chunks.find({
  "demo_id": "abc123",
  "start_game_tick": { $lte: 10000 },
  "end_game_tick": { $gte: 9000 }
}).sort({ chunk_index: 1 })

// Query specific chunk
db.demo_chunks.findOne({
  "demo_id": "abc123",
  "chunk_index": 5
})
```

## Performance Considerations

- **Chunk Size**: Default is 1000 frames. Adjust based on:
  - Average frame size (depends on player count and events)
  - Query patterns (smaller chunks = more granular queries but more documents)
  - MongoDB 16MB document limit

- **Compression**: Gzip compression can reduce storage by 70-90%
  - Recommended for long-term storage
  - Trade-off: Requires decompression when reading

- **File Size Estimates**:
  - Uncompressed: ~1-5 MB per 1000 frames (depends on players/events)
  - Compressed: ~100-500 KB per 1000 frames

## Requirements

- Go 1.21 or higher
- CS2 demo files (.dem format)
- MongoDB 4.0+ (optional, for database storage)

## License

MIT

## Credits

Built using [demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang) by Markus Walther.
