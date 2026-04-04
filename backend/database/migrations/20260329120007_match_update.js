module.exports = {
  async up(db, client) {
    // Add new fields with defaults to all existing match documents
    await db.collection('matches').updateMany(
      {},
      {
        $set: {
          map_id: '',
          visible_for_all: false,
          group_id: null,
          crawled: false,
        },
      }
    );

    // Add new indexes
    await db.collection('matches').createIndex({ map_id: 1 });
    await db.collection('matches').createIndex({ group_id: 1 });
  },

  async down(db, client) {
    await db.collection('matches').updateMany(
      {},
      {
        $unset: {
          map_id: '',
          visible_for_all: '',
          group_id: '',
          crawled: '',
        },
      }
    );

    await db.collection('matches').dropIndex({ map_id: 1 });
    await db.collection('matches').dropIndex({ group_id: 1 });
  },
};
