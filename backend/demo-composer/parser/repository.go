package parser

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const (
	defaultMatchesCollection = "matches"
	defaultChunksCollection  = "demo_chunks"
	defaultDatabaseName      = "demo-viewer"
)

type Repository struct {
	client           *mongo.Client
	matchesCol       *mongo.Collection
	chunksCol        *mongo.Collection
}

func dbNameFromURI(uri string) string {
	u, err := url.Parse(uri)
	if err != nil {
		return ""
	}
	return strings.TrimPrefix(u.Path, "/")
}

func (r *Repository) Connect(uri string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(clientOpts)
	if err != nil {
		return err
	}

	if err := client.Ping(ctx, nil); err != nil {
		return err
	}

	dbName := dbNameFromURI(uri)
	if dbName == "" {
		dbName = defaultDatabaseName
	}

	r.client = client
	r.matchesCol = client.Database(dbName).Collection(defaultMatchesCollection)
	r.chunksCol = client.Database(dbName).Collection(defaultChunksCollection)
	return nil
}

func (r *Repository) InsertMatch(header DemoHeader) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	doc := bson.M{
		"demo_id":         header.DemoID,
		"parsed_at":       header.ParsedAt,
		"date_uploaded":   time.Now(),
		"date_played":     time.Now(),
		"chunk_count":     0,
		"participants":    bson.A{},
		"visible_for_all": false,
		"crawled":         false,
		"group_id":        nil,
	}

	if header.ShareCode != "" {
		doc["share_code"] = header.ShareCode
	}

	_, err := r.matchesCol.InsertOne(ctx, doc)
	return err
}

func (r *Repository) UpdateMatchMetadata(demoID string, header DemoHeader) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.matchesCol.UpdateOne(
		ctx,
		bson.M{"demo_id": demoID},
		bson.M{"$set": bson.M{
			"map_name":        header.MapName,
			"map_id":          header.MapName,
			"server_name":     header.ServerName,
			"client_name":     header.ClientName,
			"duration":        header.Duration,
			"tick_rate":       header.TickRate,
			"frame_rate":      header.FrameRate,
			"signon_length":   header.SignonLength,
			"playback_ticks":  header.PlaybackTicks,
			"playback_frames": header.PlaybackFrames,
			"rounds":          header.Rounds,
			"outcome":         header.Outcome,
		}},
	)
	return err
}

func (r *Repository) InsertChunkBatch(chunks []DemoChunk) error {
	if len(chunks) == 0 {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	docs := make([]interface{}, len(chunks))
	for i, c := range chunks {
		docs[i] = c
	}

	_, err := r.chunksCol.InsertMany(ctx, docs)
	return err
}

func (r *Repository) FinalizeMatch(demoID string, totalChunks int, participants []MatchParticipant) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.matchesCol.UpdateOne(
		ctx,
		bson.M{"demo_id": demoID},
		bson.M{"$set": bson.M{
			"chunk_count":  totalChunks,
			"participants": participants,
		}},
	)
	return err
}

func (r *Repository) PatchTransientEventEndedAt(demoID string, patches []TransientEventPatch) error {
	if len(patches) == 0 {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	for _, p := range patches {
		filter := bson.M{
			"demo_id":     demoID,
			"chunk_index": p.ChunkIndex,
		}
		update := bson.M{
			"$set": bson.M{
				fmt.Sprintf("frames.%d.events.%d.data.ended_at", p.FrameIndex, p.EventIndex): p.EndedAt,
			},
		}
		if _, err := r.chunksCol.UpdateOne(ctx, filter, update); err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) Disconnect() error {
	if r.client == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return r.client.Disconnect(ctx)
}
