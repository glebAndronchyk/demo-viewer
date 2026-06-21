const { collMod } = require('./_utils');

module.exports = {
  async up(db) {
    const collection = db.collection('player_stats');

    await collection.updateMany({}, { $unset: { total_impact: '' } });

    await collMod(db, 'player_stats', {
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
    });
  },

  async down(db) {
    await collMod(db, 'player_stats', {
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
    });
  },
};
