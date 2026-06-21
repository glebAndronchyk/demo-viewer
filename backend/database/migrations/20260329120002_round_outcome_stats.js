const { collectionOptions } = require('./_utils');

module.exports = {
  async up(db, client) {
    const existingNames = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
    );

    // player_trades
    if (!existingNames.has('player_trades')) {
      await db.createCollection('player_trades', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['stats_id'],
            properties: {
              stats_id: { bsonType: 'string' },
              traded_teammates: { bsonType: 'int' },
              times_left_alive: { bsonType: 'int' },
              date_recorded: { bsonType: 'date' },
            },
          },
        }));
    }

    await db.collection('player_trades').createIndex({ stats_id: 1 });

    // player_economy
    if (!existingNames.has('player_economy')) {
      await db.createCollection('player_economy', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['stats_id'],
            properties: {
              stats_id: { bsonType: 'string' },
              rounds_eco: { bsonType: 'int' },
              rounds_force_buy: { bsonType: 'int' },
              rounds_full_buy: { bsonType: 'int' },
              rounds_pistol: { bsonType: 'int' },
              rounds_eco_won: { bsonType: 'int' },
              date_recorded: { bsonType: 'date' },
            },
          },
        }));
    }

    await db.collection('player_economy').createIndex({ stats_id: 1 });

    // player_clutches
    if (!existingNames.has('player_clutches')) {
      await db.createCollection('player_clutches', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['stats_id'],
            properties: {
              stats_id: { bsonType: 'string' },
              clutch_1v1: {
                bsonType: 'object',
                properties: {
                  attempted: { bsonType: 'int' },
                  won: { bsonType: 'int' },
                },
              },
              clutch_1v2: {
                bsonType: 'object',
                properties: {
                  attempted: { bsonType: 'int' },
                  won: { bsonType: 'int' },
                },
              },
              clutch_1v3: {
                bsonType: 'object',
                properties: {
                  attempted: { bsonType: 'int' },
                  won: { bsonType: 'int' },
                },
              },
              clutch_1v4: {
                bsonType: 'object',
                properties: {
                  attempted: { bsonType: 'int' },
                  won: { bsonType: 'int' },
                },
              },
              clutch_1v5: {
                bsonType: 'object',
                properties: {
                  attempted: { bsonType: 'int' },
                  won: { bsonType: 'int' },
                },
              },
            },
          },
        }));
    }

    await db.collection('player_clutches').createIndex({ stats_id: 1 });
  },

  async down(db, client) {
    await db.collection('player_trades').drop();
    await db.collection('player_economy').drop();
    await db.collection('player_clutches').drop();
  },
};
