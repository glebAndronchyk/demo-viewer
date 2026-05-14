module.exports = {
  async up(db) {
    const col = db.collection("weapon_stats");
    const indexes = await col.indexes();
    const exists = indexes.find((i) => i.name === "stats_id_1");
    if (exists) {
      await col.dropIndex("stats_id_1");
    }
  },

  async down(db) {
    const col = db.collection("weapon_stats");
    await col.createIndex({ stats_id: 1 }, { unique: true });
  },
};
