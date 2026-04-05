import parserExec from "./main" with { type: "file" };
import f from "./match.dem" with { type: "file" };

export interface ParseArgs {
  framesInChunkCount: number;
  filePath: string;
}

const parse = async (args: ParseArgs): Promise<void> => {
  const child = Bun.spawn(
    [parserExec, "-demo", f, "-chunk-size", String(args.framesInChunkCount)],
    { env: { ...process.env }, stdio: ["inherit", "inherit", "inherit"] },
  );
  const exitCode = await child.exited;
  if (exitCode !== 0) {
    throw new Error(`Demo parser exited with code ${exitCode}`);
  }
};

export default parse;
