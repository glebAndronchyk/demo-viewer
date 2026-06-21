const { collectionOptions } = require('./_utils');

module.exports = {
  async up(db, client) {
    const existingNames = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
    );

    // player_weapons_usage
    if (!existingNames.has('player_weapons_usage')) {
      await db.createCollection('player_weapons_usage', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['stats_id'],
            properties: {
              stats_id: { bsonType: 'string' },
              pistols_pct: { bsonType: 'decimal' },
              utility_pct: { bsonType: 'decimal' },
              melee_pct: { bsonType: 'decimal' },
              shotguns_pct: { bsonType: 'decimal' },
              smg_pct: { bsonType: 'decimal' },
              assault_rifle_pct: { bsonType: 'decimal' },
              sniper_rifles_pct: { bsonType: 'decimal' },
              machine_guns_pct: { bsonType: 'decimal' },
            },
          },
        }));
    }

    await db.collection('player_weapons_usage').createIndex({ stats_id: 1 });

    // weapon_stats
    if (!existingNames.has('weapon_stats')) {
      await db.createCollection('weapon_stats', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['player_weapon_usage_id', 'weapon_name'],
            properties: {
              player_weapon_usage_id: { bsonType: 'string' },
              weapon_name: { bsonType: 'string' },
              kills: { bsonType: 'int' },
              deaths: { bsonType: 'int' },
              hits: { bsonType: 'int' },
              shots: { bsonType: 'int' },
              damage: { bsonType: 'int' },
              headshots: { bsonType: 'int' },
            },
          },
        }));
    }

    await db.collection('weapon_stats').createIndex({ player_weapon_usage_id: 1 });
    await db.collection('weapon_stats').createIndex({ weapon_name: 1 });
  },

  async down(db, client) {
    await db.collection('player_weapons_usage').drop();
    await db.collection('weapon_stats').drop();
  },
};
