const { ObjectId } = require("mongodb");

const COLLECTIONS = ["player_accuracy", "player_reaction", "player_behavior"];

module.exports = {
  async up(db) {
    for (const name of COLLECTIONS) {
      const docs = await db
        .collection(name)
        .find({ stats_id: { $type: "string" } })
        .toArray();

      for (const doc of docs) {
        await db
          .collection(name)
          .updateOne(
            { _id: doc._id },
            { $set: { stats_id: new ObjectId(doc.stats_id) } },
          );
      }
    }
  },

  async down(db) {
    for (const name of COLLECTIONS) {
      const docs = await db
        .collection(name)
        .find({ stats_id: { $type: "objectId" } })
        .toArray();

      for (const doc of docs) {
        await db
          .collection(name)
          .updateOne(
            { _id: doc._id },
            { $set: { stats_id: doc.stats_id.toString() } },
          );
      }
    }
  },
};
