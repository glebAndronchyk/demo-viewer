package main

import (
	"flag"
	"log"
	"os"

	"cs2-demo-parser/parser"
)

func main() {
	demoFile := flag.String("demo", "", "Path to CS2 demo file")
	demoUrl := flag.String("url", "", "Path to CS2 demo url")
	chunkSize := flag.Int("chunk-size", 1000, "Number of frames per chunk for MongoDB storage")
	shareCode := flag.String("share-code", "", "Steam share code for this demo (used for deduplication)")
	help := flag.Bool("help", false, "Show help message")

	flag.Parse()

	if *help || (*demoFile == "" && *demoUrl == "") {
		flag.Usage()
		os.Exit(0)
	}

	if len(*demoFile) > 0 {
		if _, err := os.Stat(*demoFile); os.IsNotExist(err) {
			log.Fatalf("Demo file does not exist: %s", *demoFile)
		}
	}

	connStr := os.Getenv("DB_CONNECTION_STRING")
	if connStr == "" {
		log.Fatalf("DB_CONNECTION_STRING env variable is required")
	}

	repo := &parser.Repository{}
	if err := repo.Connect(connStr); err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer repo.Disconnect()

	p := parser.NewParser(*demoFile, *demoUrl, *chunkSize, *shareCode, repo)

	log.Printf("Started demo parsing")
	if err := p.Parse(); err != nil {
		log.Fatalf("Failed to parse demo: %v", err)
	} else {
		log.Printf("Demo parsed successfully")
	}
	log.Printf("Finished demo parsing")
}
