# Plan: Parse Demo from Remote URL Without Downloading

## Goal

Implement `ParserRepository.parseDemoFromRemote(url)` so demos are streamed directly from a remote URL into the Go parser — no temp files, no disk I/O.

## Context

- Steam demo URLs are `.dem.bz2` (bzip2-compressed)
- The Go parser (`demoinfocs-golang`) accepts any `io.Reader`
- Currently `Parse()` opens a local file; we need to refactor it to accept a reader
- `parseDemoFromRemote` is called in `DownloadAndParseDemoCommandHandler` (commented out)

## Implementation Steps

### 1. Refactor Go parser to accept `io.Reader` (`demo-composer/parser/parser.go`)

- Extract existing `Parse()` body into `ParseFromReader(r io.Reader) error`
- Update `Parse()` to open the file and call `ParseFromReader`
- Add `ParseFromURL(url string) error`:
  - HTTP GET the URL
  - If URL ends with `.bz2`, wrap body in `bzip2.NewReader`
  - Call `ParseFromReader` with the reader

```go
import (
    "compress/bzip2"
    "io"
    "net/http"
    "strings"
)

func (p *Parser) ParseFromURL(url string) error {
    resp, err := http.Get(url)
    if err != nil {
        return fmt.Errorf("failed to fetch demo: %w", err)
    }
    defer resp.Body.Close()

    var reader io.Reader = resp.Body
    if strings.HasSuffix(url, ".bz2") {
        reader = bzip2.NewReader(resp.Body)
    }

    return p.ParseFromReader(reader)
}

func (p *Parser) Parse() error {
    f, err := os.Open(p.demoFile)
    if err != nil {
        return fmt.Errorf("failed to open demo file: %w", err)
    }
    defer f.Close()
    return p.ParseFromReader(f)
}
```

### 2. Add `-url` flag to Go entry point (`demo-composer/cmd/main.go`)

- Add `demoURL` flag alongside existing `demoFile` flag
- If `-url` is provided, skip `os.Stat` check and call `p.ParseFromURL(*demoURL)`
- If `-demo` is provided, use existing `p.Parse()` path
- Require at least one of the two flags

### 3. Update TypeScript wrapper (`demo-composer/index.ts`)

```typescript
export interface ParseArgs {
  framesInChunkCount: number;
  filePath?: string;
  url?: string;
}

const parse = async (args: ParseArgs): Promise<void> => {
  if (!args.filePath && !args.url) throw new Error("filePath or url required");

  const cmd = args.url
    ? [parserExec, "-url", args.url, "-chunk-size", String(args.framesInChunkCount)]
    : [parserExec, "-demo", args.filePath!, "-chunk-size", String(args.framesInChunkCount)];

  const child = Bun.spawn(cmd, {
    env: { ...process.env },
    stdio: ["inherit", "inherit", "inherit"],
  });
  const exitCode = await child.exited;
  if (exitCode !== 0) throw new Error(`Demo parser exited with code ${exitCode}`);
};
```

### 4. Implement `ParserRepository.parseDemoFromRemote` (`api/src/repository/ParserRepository.ts`)

```typescript
async parseDemoFromRemote(url: string): Promise<object> {
  await parse({ url, framesInChunkCount: 100 });
  return {};
}
```

### 5. Uncomment the call in `DownloadAndParseDemoCommandHandler`

```typescript
const matchUrlResult = await outbound.gameCoordinatorRepository.getMatchUrlById(
  nextCodeResult.data.nextCode,
);
await outbound.parserRepository.parseDemoFromRemote(matchUrlResult.data.url);
```

## Why This Approach

- **No disk I/O** — HTTP response body streams directly through bzip2 decompressor into the demo parser
- **Memory efficient** — only one chunk's worth of frames held in RAM at a time
- **No cleanup** — no temp files to manage
- **bzip2 is stdlib** — no extra Go dependencies needed

## Notes

- Steam demo URLs expire, so parsing should start promptly after URL retrieval
- The cron job `CollectMatchesFromUserCron` will eventually trigger this flow via the `download_and_parse_demo` command