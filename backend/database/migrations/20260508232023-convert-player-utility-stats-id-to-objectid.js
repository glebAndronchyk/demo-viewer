const { ObjectId } = require("mongodb");

module.exports = {
  async up(db) {
    const docs = await db
      .collection("player_utility")
      .find({ stats_id: { $type: "string" } })
      .toArray();

    for (const doc of docs) {
      await db.collection("player_utility").updateOne(
        { _id: doc._id },
        { $set: { stats_id: new ObjectId(doc.stats_id) } },
      );
    }
  },

  async down(db) {
    const docs = await db
      .collection("player_utility")
      .find({ stats_id: { $type: "objectId" } })
      .toArray();

    for (const doc of docs) {
      await db.collection("player_utility").updateOne(
        { _id: doc._id },
        { $set: { stats_id: doc.stats_id.toString() } },
      );
    }
  },
};
