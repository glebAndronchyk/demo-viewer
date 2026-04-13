module.exports = {
  async up(db) {
    await db.collection('groups').updateMany(
      { is_open: { $exists: false } },
      { $set: { is_open: false } }
    );

    await db.command({
      collMod: 'groups',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['owner_id', 'name', 'is_open'],
          properties: {
            owner_id: { bsonType: 'string' },
            name: { bsonType: 'string' },
            is_open: { bsonType: 'bool' },
          },
        },
      },
      validationAction: 'warn',
    });
  },

  async down(db) {
    await db.collection('groups').updateMany({}, { $unset: { is_open: '' } });

    await db.command({
      collMod: 'groups',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['owner_id', 'name'],
          properties: {
            owner_id: { bsonType: 'string' },
            name: { bsonType: 'string' },
          },
        },
      },
      validationAction: 'warn',
    });
  },
};
