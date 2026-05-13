const { ObjectId } = require("mongodb");

module.exports = {
  async up(db) {
    const existingIndexes = await db.collection("notifications").indexes();
    const indexNames = existingIndexes.map((i) => i.name);
    if (indexNames.includes("recipient_user_id_1")) {
      await db.collection("notifications").dropIndex("recipient_user_id_1");
    }

    const cursor = db
      .collection("notifications")
      .find(
        { recipient_user_id: { $type: "string" } },
        { projection: { _id: 1, recipient_user_id: 1 } },
      );

    for await (const notification of cursor) {
      let userId;
      try {
        userId = new ObjectId(notification.recipient_user_id);
      } catch {
        // recipient_user_id is not a valid ObjectId string — skip
        continue;
      }
      const user = await db
        .collection("users")
        .findOne({ _id: userId }, { projection: { _id: 1 } });
      if (!user) continue;
      await db
        .collection("notifications")
        .updateOne({ _id: notification._id }, { $set: { recipient_user_id: userId } });
    }

    await db
      .collection("notifications")
      .createIndex({ recipient_user_id: 1 });
  },

  async down(db) {
    const existingIndexes = await db.collection("notifications").indexes();
    const indexNames = existingIndexes.map((i) => i.name);
    if (indexNames.includes("recipient_user_id_1")) {
      await db.collection("notifications").dropIndex("recipient_user_id_1");
    }

    const cursor = db
      .collection("notifications")
      .find(
        { recipient_user_id: { $type: "objectId" } },
        { projection: { _id: 1, recipient_user_id: 1 } },
      );

    for await (const notification of cursor) {
      await db
        .collection("notifications")
        .updateOne(
          { _id: notification._id },
          { $set: { recipient_user_id: notification.recipient_user_id.toString() } },
        );
    }

    await db
      .collection("notifications")
      .createIndex({ recipient_user_id: 1 });
  },
};
