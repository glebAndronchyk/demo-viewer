# Quick Start Guide

## Build

```bash
go build -o cs2-demo-parser ./cmd/main.go
```

## Basic Usage

Parse a demo file:

```bash
./cs2-demo-parser -demo match.dem
```

This will create `match.json` with all frame data.

## Compressed Output

For large demos, use compression:

```bash
./cs2-demo-parser -demo match.dem -compress
```

This creates `match.json.gz` (70-90% smaller).

## Custom Chunk Size

For MongoDB storage, specify chunk size:

```bash
./cs2-demo-parser -demo match.dem -chunk-size 500
```

Smaller chunks = more granular queries, but more documents.

## What Gets Captured

### Every Frame/Tick Contains:

- **Demo tick** and **game tick** numbers
- **Timestamp** (in seconds)
- **All player states**:
  - Position (X, Y, Z)
  - View direction (yaw, pitch)
  - Velocity
  - HP, armor, money
  - Equipment (weapons, grenades)
  - Status flags (alive, ducking, defusing, etc.)
- **Game state**:
  - Round number
  - Phase (PreGame, Live, etc.)
  - Scores (T/CT)
  - Bomb status
- **All events** that occurred in this frame:
  - Kills (with headshot info, weapon, etc.)
  - Damage
  - Bomb plant/defuse/explode
  - Weapon fire
  - Grenade throws
  - Item pickup/drop
  - And more...
- **Reconnections** (player connect/disconnect)

## Output Format

```json
{
  "header": {
    "demo_id": "unique-id",
    "map_name": "de_dust2",
    "duration": 2450.5,
    "tick_rate": 64.0,
    ...
  },
  "frames": [
    {
      "demo_tick": 1,
      "game_tick": 0,
      "timestamp": 0.0,
      "player_states": [...],
      "game_state": {...},
      "events": [...],
      "reconnections": [...]
    },
    ...
  ],
  "chunk_size": 1000,
  "total_chunks": 145
}
```

## MongoDB Integration

See `examples/mongodb_example.go` for complete integration code.

### Key Points:

1. **Store header** in `demo_headers` collection
2. **Store chunks** in `demo_chunks` collection
3. **Use compression** with `parser.CompressChunk()`
4. **Query by tick range**:

```go
filter := bson.M{
    "demo_id": "your-demo-id",
    "start_tick": bson.M{"$lte": 100},
    "end_tick": bson.M{"$gte": 1},
}
```

## Package Usage

```go
import "cs2-demo-parser/parser"

// Parse
p := parser.NewParser("match.dem", 1000)
data, err := p.Parse()

// Export to JSON
parser.ExportToJSON(data, "output.json")

// Or compressed
parser.ExportToJSONGzip(data, "output.json.gz")

// Get chunks for MongoDB
chunks := parser.GetChunks(data)

// Compress chunk
parser.CompressChunk(&chunks[0])
```

## Tips

- **Chunk size**: Use 500-1000 for balanced performance
- **Compression**: Always compress for long-term storage
- **Querying**: Create MongoDB indexes on `demo_id`, `start_tick`, `end_tick`
- **Memory**: Large demos may use significant RAM during parsing

## Troubleshooting

### "Failed to open demo file"
- Check file path is correct
- Ensure it's a valid CS2 .dem file

### "Out of memory"
- Try parsing in smaller chunks
- Increase system memory
- Use compression immediately after parsing

### "MongoDB document too large"
- Reduce chunk size (default 1000 → 500)
- Always compress chunks before storing
