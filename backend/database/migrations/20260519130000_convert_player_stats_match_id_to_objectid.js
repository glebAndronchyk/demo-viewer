const { ObjectId } = require("mongodb");
const { collMod } = require("../migrationUtils");

module.exports = {
  async up(db) {
    const docs = await db
      .collection("player_stats")
      .find({ match_id: { $type: "string" } })
      .toArray();

    for (const doc of docs) {
      await db
        .collection("player_stats")
        .updateOne(
          { _id: doc._id },
          { $set: { match_id: new ObjectId(doc.match_id) } },
        );
    }

    await collMod(db, "player_stats", {
      $jsonSchema: {
        bsonType: "object",
        required: ["participant_steam_id"],
        properties: {
          participant_steam_id: { bsonType: "string" },
          match_id: { bsonType: "objectId" },
          total_kills: { bsonType: "int" },
          total_deaths: { bsonType: "int" },
          total_utility_damage: { bsonType: "decimal" },
          total_adr: { bsonType: "decimal" },
          total_mvps: { bsonType: "int" },
          total_hs: { bsonType: "decimal" },
          total_assists: { bsonType: "int" },
          total_kpr: { bsonType: "decimal" },
          total_apr: { bsonType: "decimal" },
          total_score: { bsonType: "int" },
          total_rounds_played: { bsonType: "int" },
          date_recorded: { bsonType: "date" },
        },
      },
    });
  },

  async down(db) {
    const docs = await db
      .collection("player_stats")
      .find({ match_id: { $type: "objectId" } })
      .toArray();

    for (const doc of docs) {
      await db
        .collection("player_stats")
        .updateOne(
          { _id: doc._id },
          { $set: { match_id: doc.match_id.toString() } },
        );
    }

    await collMod(db, "player_stats", {
      $jsonSchema: {
        bsonType: "object",
        required: ["participant_steam_id"],
        properties: {
          participant_steam_id: { bsonType: "string" },
          match_id: { bsonType: "string" },
          total_kills: { bsonType: "int" },
          total_deaths: { bsonType: "int" },
          total_utility_damage: { bsonType: "decimal" },
          total_adr: { bsonType: "decimal" },
          total_mvps: { bsonType: "int" },
          total_hs: { bsonType: "decimal" },
          total_assists: { bsonType: "int" },
          total_kpr: { bsonType: "decimal" },
          total_apr: { bsonType: "decimal" },
          total_score: { bsonType: "int" },
          total_rounds_played: { bsonType: "int" },
          date_recorded: { bsonType: "date" },
        },
      },
    });
  },
};
