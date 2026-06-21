const { collectionOptions } = require('../migrationUtils');

const DEMO_CHUNKS_VALIDATOR = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'message_type',
      'demo_id',
      'chunk_index',
      'start_tick',
      'end_tick',
      'start_game_tick',
      'end_game_tick',
      'frames',
    ],
    properties: {
      message_type: { bsonType: 'string' },
      demo_id: { bsonType: 'string' },
      chunk_index: { bsonType: 'int' },
      start_tick: { bsonType: 'int' },
      end_tick: { bsonType: 'int' },
      start_game_tick: { bsonType: 'int' },
      end_game_tick: { bsonType: 'int' },
      frames: { bsonType: 'array' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
  },
};

const MATCHES_VALIDATOR = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['date_uploaded', 'date_played', 'chunk_count', 'participants'],
    properties: {
      date_uploaded: { bsonType: 'date' },
      date_played: { bsonType: 'date' },
      chunk_count: { bsonType: 'int' },
      participants: { bsonType: 'array' },
      map_id: { bsonType: 'string' },
      visible_for_all: { bsonType: 'bool' },
      group_id: { bsonType: ['string', 'null'] },
      crawled: { bsonType: 'bool' },
      demo_id: { bsonType: 'string' },
      map_name: { bsonType: 'string' },
      server_name: { bsonType: 'string' },
      client_name: { bsonType: 'string' },
      duration: { bsonType: 'double' },
      tick_rate: { bsonType: 'double' },
      frame_rate: { bsonType: 'double' },
      signon_length: { bsonType: 'double' },
      playback_ticks: { bsonType: 'double' },
      playback_frames: { bsonType: 'double' },
      parsed_at: { bsonType: 'string' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
  },
};

async function recreateDemoChunks(db, withStorageEngine = false) {
  await db.collection('demo_chunks').drop();
  await db.createCollection('demo_chunks', collectionOptions(DEMO_CHUNKS_VALIDATOR, { storageEngine: withStorageEngine }));
  const col = db.collection('demo_chunks');
  await col.createIndex({ demo_id: 1 });
  await col.createIndex({ demo_id: 1, chunk_index: 1 }, { unique: true });
  await col.createIndex({ demo_id: 1, start_tick: 1, end_tick: 1 });
  await col.createIndex({ 'frames.player_states.steam_id_64': 1 });
  await col.createIndex({ 'frames.events.type': 1 });
}

async function recreateMatches(db, withStorageEngine = false) {
  await db.collection('matches').drop().catch(() => {});
  await db.createCollection('matches', collectionOptions(MATCHES_VALIDATOR, { storageEngine: withStorageEngine }));
  const col = db.collection('matches');
  await col.createIndex({ date_played: -1 });
  await col.createIndex({ date_uploaded: -1 });
  await col.createIndex({ 'participants.steam_id': 1 });
  await col.createIndex({ 'participants.user_id': 1 });
  await col.createIndex({ map_id: 1 });
  await col.createIndex({ group_id: 1 });
  await col.createIndex({ demo_id: 1 }, { unique: true, sparse: true });
  await col.createIndex({ map_name: 1 });
}

module.exports = {
  async up(db) {
    await recreateDemoChunks(db, true);
    await recreateMatches(db, true);
  },

  async down(db) {
    await recreateDemoChunks(db, false);
    await recreateMatches(db, false);
  },
};
