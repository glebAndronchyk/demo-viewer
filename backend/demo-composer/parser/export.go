package parser

//
//import (
//	"encoding/json"
//	"fmt"
//	"math"
//	"os"
//)
//
//// sanitizeFloat64 replaces NaN and Inf with 0
//func sanitizeFloat64(f float64) float64 {
//	if math.IsNaN(f) || math.IsInf(f, 0) {
//		return 0.0
//	}
//	return f
//}
//
//// sanitizeFloat32 replaces NaN and Inf with 0
//func sanitizeFloat32(f float32) float32 {
//	if math.IsNaN(float64(f)) || math.IsInf(float64(f), 0) {
//		return 0.0
//	}
//	return f
//}
//
//// sanitizeFrames sanitizes all float values in a slice of frames
//func sanitizeFrames(frames []Frame) {
//	for i := range frames {
//		frame := &frames[i]
//		frame.Timestamp = sanitizeFloat64(frame.Timestamp)
//
//		// Sanitize player states
//		for j := range frame.PlayerStates {
//			ps := &frame.PlayerStates[j]
//			ps.Position.X = sanitizeFloat64(ps.Position.X)
//			ps.Position.Y = sanitizeFloat64(ps.Position.Y)
//			ps.Position.Z = sanitizeFloat64(ps.Position.Z)
//			ps.ViewDirection.X = sanitizeFloat64(ps.ViewDirection.X)
//			ps.ViewDirection.Y = sanitizeFloat64(ps.ViewDirection.Y)
//			ps.Velocity.X = sanitizeFloat64(ps.Velocity.X)
//			ps.Velocity.Y = sanitizeFloat64(ps.Velocity.Y)
//			ps.Velocity.Z = sanitizeFloat64(ps.Velocity.Z)
//			ps.FlashDuration = sanitizeFloat32(ps.FlashDuration)
//		}
//
//		// Sanitize game state
//		frame.GameState.TimeRemaining = sanitizeFloat64(frame.GameState.TimeRemaining)
//		frame.GameState.BombTimeRemaining = sanitizeFloat64(frame.GameState.BombTimeRemaining)
//	}
//}
//
//// sanitizeDemoData sanitizes all float values in the demo data
//func sanitizeDemoData(data *DemoData) {
//	// Sanitize header
//	data.Header.Duration = sanitizeFloat64(data.Header.Duration)
//	data.Header.TickRate = sanitizeFloat32(data.Header.TickRate)
//	data.Header.FrameRate = sanitizeFloat32(data.Header.FrameRate)
//
//	// Sanitize frames
//	sanitizeFrames(data.Frames)
//}
//
//// ExportToJSON exports demo data to a JSON file
//func ExportToJSON(data *DemoData, outputPath string) error {
//	// Sanitize data before marshaling
//	sanitizeDemoData(data)
//
//	jsonData, err := json.MarshalIndent(data, "", "  ")
//	if err != nil {
//		return fmt.Errorf("failed to marshal JSON: %w", err)
//	}
//
//	err = os.WriteFile(outputPath, jsonData, 0644)
//	if err != nil {
//		return fmt.Errorf("failed to write JSON file: %w", err)
//	}
//
//	return nil
//}
//
//// GetChunks splits the demo data into chunks for MongoDB storage
//func GetChunks(data *DemoData) []DemoChunk {
//	chunks := make([]DemoChunk, 0)
//	totalFrames := len(data.Frames)
//
//	for i := 0; i < totalFrames; i += data.ChunkSize {
//		end := i + data.ChunkSize
//		if end > totalFrames {
//			end = totalFrames
//		}
//
//		frameSlice := data.Frames[i:end]
//
//		if len(frameSlice) == 0 {
//			continue
//		}
//
//		chunk := DemoChunk{
//			DemoID:        data.Header.DemoID,
//			ChunkIndex:    i / data.ChunkSize,
//			StartTick:     frameSlice[0].DemoTick,
//			EndTick:       frameSlice[len(frameSlice)-1].DemoTick,
//			StartGameTick: frameSlice[0].GameTick,
//			EndGameTick:   frameSlice[len(frameSlice)-1].GameTick,
//			Frames:        frameSlice,
//		}
//
//		chunks = append(chunks, chunk)
//	}
//
//	return chunks
//}
//
////func CreateChunkedJson(data *DemoData) error {
////	headerJson, err := json.MarshalIndent(data.Header, "", "  ")
////	if err != nil {
////
////		return fmt.Errorf("failed to marshal header: %w", err)
////	}
////
////	chunks := GetChunks(data)
////
////	for _, chunk := range chunks {
////		sanitizeFrames(chunk.Frames)
////
////		chunkJson, err := json.MarshalIndent(chunk, "", "  ")
////		if err != nil {
////			return fmt.Errorf("failed to marshal chunk: %w", err)
////		}
////	}
////
////	indexData := map[string]interface{}{
////		"demo_id":      data.Header.DemoID,
////		"total_chunks": data.TotalChunks,
////		"chunk_size":   data.ChunkSize,
////		"total_frames": len(data.Frames),
////		"map_name":     data.Header.MapName,
////		"duration":     data.Header.Duration,
////	}
////	indexJSON, err := json.MarshalIndent(indexData, "", "  ")
////
////	return nil
////}
//
//// writerBuffer is a helper to write to a byte slice
//type writerBuffer struct {
//	buf *[]byte
//}
//
//func (w *writerBuffer) Write(p []byte) (n int, err error) {
//	*w.buf = append(*w.buf, p...)
//	return len(p), nil
//}
