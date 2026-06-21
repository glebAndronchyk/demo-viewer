const { collectionOptions } = require('../migrationUtils');

module.exports = {
  async up(db, client) {
    const existingNames = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
    );

    // utility_schema
    if (!existingNames.has('utility_schema'))
      await db.createCollection('utility_schema', collectionOptions({
        $jsonSchema: {
          bsonType: 'object',
          required: ['stats_id'],
          properties: {
            stats_id: { bsonType: 'string' },
            grenades_thrown: { bsonType: 'int' },
            he_thrown: { bsonType: 'int' },
            smokes_thrown: { bsonType: 'int' },
            molotovs_thrown: { bsonType: 'int' },
            flashes_thrown: { bsonType: 'int' },
            incendiaries_thrown: { bsonType: 'int' },
            teammates_flashed: { bsonType: 'int' },
            utility_damage: { bsonType: 'int' },
            utility_value: { bsonType: 'int' },
            enemies_flashed: { bsonType: 'int' },
            flash_duration: { bsonType: 'decimal' },
            date_recorded: { bsonType: 'date' },
          },
        },
      }));

    await db.collection('utility_schema').createIndex({ stats_id: 1 });

    // positions_stats — rename from positions_stats_schema if it exists
    const collections = await db
      .listCollections({ name: 'positions_stats_schema' })
      .toArray();

    if (collections.length > 0) {
      await db.collection('positions_stats_schema').rename('positions_stats');
    } else if (!existingNames.has('positions_stats')) {
      await db.createCollection('positions_stats', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['stats_id'],
            properties: {
              stats_id: { bsonType: 'string' },
              sector_id: { bsonType: 'string' },
              time_spent_sec: { bsonType: 'decimal' },
              kills_from: { bsonType: 'int' },
              deaths_at: { bsonType: 'int' },
              rounds_played: { bsonType: 'int' },
              date_recorded: { bsonType: 'date' },
            },
          },
        }));
    }

    await db.collection('positions_stats').createIndex({ stats_id: 1 });
    await db.collection('positions_stats').createIndex({ sector_id: 1 });
  },

  async down(db, client) {
    await db.collection('utility_schema').drop();

    // Rename positions_stats back to positions_stats_schema on rollback
    const collections = await db
      .listCollections({ name: 'positions_stats' })
      .toArray();

    if (collections.length > 0) {
      await db.collection('positions_stats').drop();
    }
  },
};
