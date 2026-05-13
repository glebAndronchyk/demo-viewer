module.exports = {
  async up(db) {
    const col = db.collection('notifications');
    await col.createIndex({ status: 1, expiresAt: 1 });
  },

  async down(db) {
    const col = db.collection('notifications');
    await col.dropIndex({ status: 1, expiresAt: 1 });
  },
};
