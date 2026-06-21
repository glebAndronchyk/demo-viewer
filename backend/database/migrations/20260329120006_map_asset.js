const { collectionOptions } = require('./_utils');

module.exports = {
  async up(db, client) {
    const existingNames = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
    );

    // assets
    if (!existingNames.has('assets')) {
      await db.createCollection('assets', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['path', 'dimensions'],
            properties: {
              path: { bsonType: 'string' },
              dimensions: {
                bsonType: 'object',
                required: ['width', 'height'],
                properties: {
                  width: { bsonType: 'int' },
                  height: { bsonType: 'int' },
                },
              },
            },
          },
        }));
    }

    await db.collection('assets').createIndex({ path: 1 });

    // maps
    if (!existingNames.has('maps')) {
      await db.createCollection('maps', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['map_name', 'asset_id'],
            properties: {
              map_name: { bsonType: 'string' },
              asset_id: { bsonType: 'string' },
            },
          },
        }));
    }

    await db.collection('maps').createIndex({ map_name: 1 }, { unique: true });
    await db.collection('maps').createIndex({ asset_id: 1 });

    // map_sectors
    if (!existingNames.has('map_sectors')) {
      await db.createCollection('map_sectors', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['sector_name', 'rect', 'map_id'],
            properties: {
              sector_name: { bsonType: 'string' },
              rect: {
                bsonType: 'object',
                required: ['x1', 'y1', 'x2', 'y2'],
                properties: {
                  x1: { bsonType: 'decimal' },
                  y1: { bsonType: 'decimal' },
                  x2: { bsonType: 'decimal' },
                  y2: { bsonType: 'decimal' },
                },
              },
              map_id: { bsonType: 'string' },
            },
          },
        }));
    }

    await db.collection('map_sectors').createIndex({ map_id: 1 });
  },

  async down(db, client) {
    await db.collection('assets').drop();
    await db.collection('maps').drop();
    await db.collection('map_sectors').drop();
  },
};
