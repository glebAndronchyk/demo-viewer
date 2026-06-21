const { collectionOptions } = require('./_utils');

module.exports = {
  async up(db, client) {
    const existingNames = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
    );

    // users
    if (!existingNames.has('users')) {
      await db.createCollection('users', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['steam_id'],
            properties: {
              steam_id: { bsonType: 'string' },
            },
          },
        }));
    }

    await db.collection('users').createIndex({ steam_id: 1 }, { unique: true });

    // groups
    if (!existingNames.has('groups')) {
      await db.createCollection('groups', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['owner_id', 'name'],
            properties: {
              owner_id: { bsonType: 'string' },
              name: { bsonType: 'string' },
            },
          },
        }));
    }

    await db.collection('groups').createIndex({ owner_id: 1 });

    // group_members
    if (!existingNames.has('group_members')) {
      await db.createCollection('group_members', collectionOptions({
          $jsonSchema: {
            bsonType: 'object',
            required: ['user_id', 'group_id'],
            properties: {
              user_id: { bsonType: 'string' },
              group_id: { bsonType: 'string' },
            },
          },
        }));
    }

    await db.collection('group_members').createIndex({ user_id: 1 });
    await db.collection('group_members').createIndex({ group_id: 1 });
    await db
      .collection('group_members')
      .createIndex({ user_id: 1, group_id: 1 }, { unique: true });
  },

  async down(db, client) {
    await db.collection('users').drop();
    await db.collection('groups').drop();
    await db.collection('group_members').drop();
  },
};
