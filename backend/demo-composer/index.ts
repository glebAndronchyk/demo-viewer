// todo cross-platform support
import parserExec from "./main.bin" with { type: "file" };

export interface ParseArgs {
  framesInChunkCount: number;
  filePath?: string | null;
  fileUrl?: string | null;
}

const parse = (args: ParseArgs): { pid: number; promise: Promise<number> } => {
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

  child.exited
    .then((code) => {
      if (code !== 0) {
        throw new Error(`Demo parser exited with code ${code}.`);
      }
    })
    .catch(() => {
      throw new Error("Parser failed to start.");
    });

  return {
    pid: child.pid,
    promise: child.exited,
  };
};

export default parse;
