package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"cs2-demo-parser/parser"
)

func main() {
	// Command line flags
	demoFile := flag.String("demo", "", "Path to CS2 demo file (required)")
	chunkSize := flag.Int("chunk-size", 1000, "Number of frames per chunk for MongoDB storage")
	help := flag.Bool("help", false, "Show help message")

	flag.Parse()

	if *help || *demoFile == "" {
		printHelp()
		os.Exit(0)
	}

	if _, err := os.Stat(*demoFile); os.IsNotExist(err) {
		log.Fatalf("Demo file does not exist: %s", *demoFile)
	}

	fmt.Printf("Parsing demo file: %s\n", *demoFile)
	fmt.Printf("Chunk size: %d frames\n", *chunkSize)
	fmt.Println()

	p := parser.NewParser(*demoFile, *chunkSize)

	fmt.Println("Parsing demo... This may take a while for large demos.")
	demoData, err := p.Parse()
	if err != nil {
		panic(err)
	}

	fmt.Printf("Parsed total: %d chunks\n", demoData.TotalChunks)
	fmt.Println()
}

func printHelp() {
	fmt.Println("CS2 Demo Parser - Parse CS2 demo files to JSON")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  cs2-demo-parser -demo <path-to-demo> [options]")
	fmt.Println()
	fmt.Println("Options:")
	fmt.Println("  -demo string")
	fmt.Println("        Path to CS2 demo file (required)")
	fmt.Println("  -output string")
	fmt.Println("        Path to output JSON file or directory (default: <demo-name>.json)")
	fmt.Println("  -chunk-size int")
	fmt.Println("        Number of frames per chunk for MongoDB storage (default: 1000)")
	fmt.Println("  -chunked")
	fmt.Println("        Export as separate chunk files in a directory instead of single file")
	fmt.Println("  -help")
	fmt.Println("        Show this help message")
	fmt.Println()
	fmt.Println("Examples:")
	fmt.Println("  cs2-demo-parser -demo match.dem")
	fmt.Println("  cs2-demo-parser -demo match.dem -output result.json")
	fmt.Println("  cs2-demo-parser -demo match.dem -chunk-size 500")
	fmt.Println()
}
