const { ObjectId } = require("mongodb");

module.exports = {
  async up(db) {
    const docs = await db
      .collection("group_members")
      .find({ group_id: { $type: "string" } })
      .toArray();

    for (const doc of docs) {
      await db.collection("group_members").updateOne(
        { _id: doc._id },
        { $set: { group_id: new ObjectId(doc.group_id) } },
      );
    }
  },

  async down(db) {
    const docs = await db
      .collection("group_members")
      .find({ group_id: { $type: "objectId" } })
      .toArray();

    for (const doc of docs) {
      await db.collection("group_members").updateOne(
        { _id: doc._id },
        { $set: { group_id: doc.group_id.toString() } },
      );
    }
  },
};
