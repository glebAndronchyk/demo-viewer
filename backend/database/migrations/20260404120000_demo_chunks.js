module.exports = {
  async up(db, client) {
    await db.createCollection('demo_chunks', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['message_type', 'demo_id', 'chunk_index', 'start_tick', 'end_tick', 'start_game_tick', 'end_game_tick', 'frames'],
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
      },
      validationAction: 'warn',
    });

    const collection = db.collection('demo_chunks');
    await collection.createIndex({ demo_id: 1 });
    await collection.createIndex({ demo_id: 1, chunk_index: 1 }, { unique: true });
    await collection.createIndex({ demo_id: 1, start_tick: 1, end_tick: 1 });
    await collection.createIndex({ 'frames.player_states.steam_id_64': 1 });
    await collection.createIndex({ 'frames.events.type': 1 });
  },

  async down(db, client) {
    await db.collection('demo_chunks').drop();
  },
};
