const collections = [
  "player_accuracy",
  "player_economy",
  "player_utility",
  "weapon_stats",
  "player_weapons_usage",
];

module.exports = {
  async up(db) {
    await Promise.all(
      collections.map(async (c) => {
        const col = db.collection(c);

        // Remove duplicates — keep the most recently inserted doc per stats_id
        const duplicates = await col.aggregate([
          { $group: { _id: "$stats_id", ids: { $push: "$_id" }, count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } },
        ]).toArray();

        for (const { ids } of duplicates) {
          // Keep the last inserted (highest _id), delete the rest
          const [, ...toDelete] = ids.slice().reverse();
          await col.deleteMany({ _id: { $in: toDelete } });
        }

        const indexes = await col.indexes();
        const exists = indexes.find((i) => i.name === "stats_id_1");
        if (exists) {
          await col.dropIndex("stats_id_1");
        }
        await col.createIndex({ stats_id: 1 }, { unique: true });
      }),
    );
  },

  async down(db) {
    await Promise.all(
      collections.map(async (c) => {
        const col = db.collection(c);
        await col.dropIndex("stats_id_1");
        await col.createIndex({ stats_id: 1 });
      }),
    );
  },
};
