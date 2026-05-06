module.exports = {
  async up(db) {
    await db.createCollection('notifications');
    const col = db.collection('notifications');
    await col.createIndex({ recipient_user_id: 1 });
    await col.createIndex({ status: 1 });
  },

  async down(db) {
    await db.collection('notifications').drop();
  },
};
