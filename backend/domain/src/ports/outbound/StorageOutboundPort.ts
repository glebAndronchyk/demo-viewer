export interface StreamAssetResponse {
  preflight: { contentType: string };
  stream: () => ReadableStream;
}

export interface StorageOutboundPort {
  getAsset(objectPath: string): Promise<string | StreamAssetResponse | null>;

  /**
   * Returns a URL to the asset. Used when usesRedirect is true (e.g. S3, Azure, GCS).
   * The caller should issue a 302 redirect to this URL.
   */
  resolveAssetUrl(objectPath: string): Promise<string>;

  /**
   * Returns a readable stream for the asset. Used when usesRedirect is false (e.g. local filesystem).
   * Returns null if the asset does not exist.
   */
  streamAsset(objectPath: string): Promise<StreamAssetResponse | null>;

  /**
   * Return a list of file names under the path
   */
  ls(path: string): Promise<string[]>;

  /**
   * Return a list of file names under the path
   */
  lsMapRadar(
    path: string,
    transform?: (p: string) => string,
  ): Promise<Record<number | "buyzones" | "manifest", string>>;

  /**
   * When true, the API should redirect the client to resolveAssetUrl().
   * When false, the API should stream bytes via streamAsset().
   */
  readonly usesRedirect: boolean;
}
