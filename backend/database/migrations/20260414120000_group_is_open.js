const { collMod } = require('../migrationUtils');

module.exports = {
  async up(db) {
    await db.collection('groups').updateMany(
      { is_open: { $exists: false } },
      { $set: { is_open: false } }
    );

    await collMod(db, 'groups', {
      $jsonSchema: {
        bsonType: 'object',
        required: ['owner_id', 'name', 'is_open'],
        properties: {
          owner_id: { bsonType: 'string' },
          name: { bsonType: 'string' },
          is_open: { bsonType: 'bool' },
        },
      },
    });
  },

  async down(db) {
    await db.collection('groups').updateMany({}, { $unset: { is_open: '' } });

    await collMod(db, 'groups', {
      $jsonSchema: {
        bsonType: 'object',
        required: ['owner_id', 'name'],
        properties: {
          owner_id: { bsonType: 'string' },
          name: { bsonType: 'string' },
        },
      },
    });
  },
};
