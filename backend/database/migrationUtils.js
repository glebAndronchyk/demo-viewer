// When ZSTD_SUPPORT=true, validators and WiredTiger storageEngine options are applied.
// CosmosDB for MongoDB supports neither — leave the flag unset or false in that environment.
const isZstdSupported = process.env.ZSTD_SUPPORT === 'true';

const ZSTD_STORAGE_ENGINE = {
  wiredTiger: { configString: 'block_compressor=zstd' },
};

/**
 * Returns createCollection options with validator and optional storageEngine,
 * or an empty object when running on CosmosDB.
 */
function collectionOptions(validator, { storageEngine = false } = {}) {
  if (!isZstdSupported) return {};
  const opts = { validator, validationAction: 'warn' };
  if (storageEngine) opts.storageEngine = ZSTD_STORAGE_ENGINE;
  return opts;
}

/**
 * Runs a collMod validator update only on standard MongoDB.
 * No-op on CosmosDB (ZSTD_SUPPORT not set).
 */
async function collMod(db, collectionName, validator) {
  if (!isZstdSupported) return;
  await db.command({
    collMod: collectionName,
    validator,
    validationAction: 'warn',
  });
}

module.exports = { collectionOptions, collMod, ZSTD_STORAGE_ENGINE, isZstdSupported };
