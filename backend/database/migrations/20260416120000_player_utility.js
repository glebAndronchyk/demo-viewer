const { collectionOptions } = require('../migrationUtils');

module.exports = {
  async up(db) {
    const existingNames = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
    );

    if (!existingNames.has('player_utility')) {
      await db.createCollection('player_utility', collectionOptions({
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
              enemies_flashed: { bsonType: 'int' },
              flash_duration: { bsonType: 'decimal' },
              molotovs_damage: { bsonType: 'int' },
              he_damage: { bsonType: 'int' },
              date_recorded: { bsonType: 'date' },
            },
          },
        }));
    }

    await db.collection('player_utility').createIndex({ stats_id: 1 });
  },

  async down(db) {
    await db.collection('player_utility').drop();
  },
};
