// todo cross-platform support
import parserExec from "./main.bin" with { type: "file" };

export interface ParseArgs {
  framesInChunkCount: number;
  filePath?: string | null;
  fileUrl?: string | null;
}

const parse = async (args: ParseArgs): Promise<void> => {
  const child = Bun.spawn(
    Boolean(args.filePath)
      ? [
          parserExec,
          "-demo",
          args.filePath ?? "",
          "-chunk-size",
          String(args.framesInChunkCount),
        ]
      : [
          parserExec,
          "-url",
          args.fileUrl ?? "",
          "-chunk-size",
          String(args.framesInChunkCount),
        ],
    { env: { ...process.env }, stdio: ["inherit", "inherit", "inherit"] },
  );
  const exitCode = await child.exited;

  if (exitCode !== 0) {
    throw new Error(`Demo parser exited with code ${exitCode}`);
  }
};

export default parse;
