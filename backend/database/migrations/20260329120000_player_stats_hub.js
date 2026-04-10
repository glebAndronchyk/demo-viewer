module.exports = {
  async up(db, client) {
    const existing = await db.listCollections({ name: 'player_stats' }).toArray();
    if (existing.length > 0) return;

    await db.createCollection('player_stats', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['participant_steam_id'],
          properties: {
            participant_steam_id: { bsonType: 'string' },
            total_kills: { bsonType: 'int' },
            total_deaths: { bsonType: 'int' },
            total_utility_damage: { bsonType: 'decimal' },
            total_adr: { bsonType: 'decimal' },
            total_mvps: { bsonType: 'int' },
            total_hs: { bsonType: 'decimal' },
            total_assists: { bsonType: 'int' },
            total_kpr: { bsonType: 'decimal' },
            total_impact: { bsonType: 'decimal' },
            total_apr: { bsonType: 'decimal' },
            total_dpr: { bsonType: 'decimal' },
            total_score: { bsonType: 'int' },
            match_id: { bsonType: 'string' },
            total_rounds_played: { bsonType: 'int' },
            date_recorded: { bsonType: 'date' },
          },
        },
      },
      validationAction: 'warn',
    });

    const collection = db.collection('player_stats');
    await collection.createIndex({ participant_steam_id: 1 });
    await collection.createIndex({ match_id: 1 });
    await collection.createIndex({ date_recorded: -1 });
  },

  async down(db, client) {
    await db.collection('player_stats').drop();
  },
};
