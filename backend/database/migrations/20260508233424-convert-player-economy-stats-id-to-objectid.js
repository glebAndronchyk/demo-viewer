const { ObjectId } = require("mongodb");

module.exports = {
  async up(db) {
    for (const collection of ["player_economy", "player_trades", "player_clutches"]) {
      const docs = await db
        .collection(collection)
        .find({ stats_id: { $type: "string" } })
        .toArray();

      for (const doc of docs) {
        await db.collection(collection).updateOne(
          { _id: doc._id },
          { $set: { stats_id: new ObjectId(doc.stats_id) } },
        );
      }
    }
  },

  async down(db) {
    for (const collection of ["player_economy", "player_trades", "player_clutches"]) {
      const docs = await db
        .collection(collection)
        .find({ stats_id: { $type: "objectId" } })
        .toArray();

      for (const doc of docs) {
        await db.collection(collection).updateOne(
          { _id: doc._id },
          { $set: { stats_id: doc.stats_id.toString() } },
        );
      }
    }
  },
};
