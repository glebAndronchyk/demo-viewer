const { ObjectId } = require("mongodb");

module.exports = {
  async up(db) {
    const docs = await db
      .collection("group_members")
      .find({ user_id: { $type: "string" } })
      .toArray();

    for (const doc of docs) {
      await db.collection("group_members").updateOne(
        { _id: doc._id },
        { $set: { user_id: new ObjectId(doc.user_id) } },
      );
    }
  },

  async down(db) {
    const docs = await db
      .collection("group_members")
      .find({ user_id: { $type: "objectId" } })
      .toArray();

    for (const doc of docs) {
      await db.collection("group_members").updateOne(
        { _id: doc._id },
        { $set: { user_id: doc.user_id.toString() } },
      );
    }
  },
};