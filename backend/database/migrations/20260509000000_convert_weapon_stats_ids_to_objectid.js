const { ObjectId } = require("mongodb");

module.exports = {
  async up(db) {
    // Convert player_weapons_usage.stats_id from string to ObjectId
    const usageDocs = await db
      .collection("player_weapons_usage")
      .find({ stats_id: { $type: "string" } })
      .toArray();

    for (const doc of usageDocs) {
      await db.collection("player_weapons_usage").updateOne(
        { _id: doc._id },
        { $set: { stats_id: new ObjectId(doc.stats_id) } },
      );
    }

    // Convert weapon_stats.player_weapon_usage_id from string to ObjectId
    const statsDocs = await db
      .collection("weapon_stats")
      .find({ player_weapon_usage_id: { $type: "string" } })
      .toArray();

    for (const doc of statsDocs) {
      await db.collection("weapon_stats").updateOne(
        { _id: doc._id },
        {
          $set: {
            player_weapon_usage_id: new ObjectId(doc.player_weapon_usage_id),
          },
        },
      );
    }
  },

  async down(db) {
    const usageDocs = await db
      .collection("player_weapons_usage")
      .find({ stats_id: { $type: "objectId" } })
      .toArray();

    for (const doc of usageDocs) {
      await db.collection("player_weapons_usage").updateOne(
        { _id: doc._id },
        { $set: { stats_id: doc.stats_id.toString() } },
      );
    }

    const statsDocs = await db
      .collection("weapon_stats")
      .find({ player_weapon_usage_id: { $type: "objectId" } })
      .toArray();

    for (const doc of statsDocs) {
      await db.collection("weapon_stats").updateOne(
        { _id: doc._id },
        {
          $set: {
            player_weapon_usage_id: doc.player_weapon_usage_id.toString(),
          },
        },
      );
    }
  },
};