module.exports = {
  async up(db) {
    const collection = db.collection('player_stats');

    // Remove the field from all existing documents
    await collection.updateMany({}, { $unset: { total_impact: '' } });

    // Update the collection validator to remove total_impact from $jsonSchema
    await db.command({
      collMod: 'player_stats',
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
  },

  async down(db) {
    // Restore validator with total_impact
    await db.command({
      collMod: 'player_stats',
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
  },
};
