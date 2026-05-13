const { ObjectId } = require("mongodb");

module.exports = {
  async up(db) {
    const chunks = await db
      .collection("demo_chunks")
      .find({ demo_id: { $exists: true } })
      .toArray();

    for (const chunk of chunks) {
      const match = await db
        .collection("matches")
        .findOne({ demo_id: chunk.demo_id }, { projection: { _id: 1 } });
      if (!match) continue;
      await db.collection("demo_chunks").updateOne(
        { _id: chunk._id },
        {
          $set: { match_id: match._id },
          $unset: { demo_id: "" },
        },
      );
    }

    await db.collection("demo_chunks").createIndex({ match_id: 1 });
    await db
      .collection("demo_chunks")
      .createIndex({ match_id: 1, chunk_index: 1 }, { unique: true });
    await db
      .collection("demo_chunks")
      .createIndex({ match_id: 1, start_tick: 1, end_tick: 1 });
  },

  async down(db) {
    const chunks = await db
      .collection("demo_chunks")
      .find({ match_id: { $exists: true } })
      .toArray();

    for (const chunk of chunks) {
      const match = await db
        .collection("matches")
        .findOne({ _id: chunk.match_id }, { projection: { demo_id: 1 } });
      if (!match) continue;
      await db.collection("demo_chunks").updateOne(
        { _id: chunk._id },
        {
          $set: { demo_id: match.demo_id },
          $unset: { match_id: "" },
        },
      );
    }

    await db.collection("demo_chunks").createIndex({ demo_id: 1 });
    await db
      .collection("demo_chunks")
      .createIndex({ demo_id: 1, chunk_index: 1 }, { unique: true });
    await db
      .collection("demo_chunks")
      .createIndex({ demo_id: 1, start_tick: 1, end_tick: 1 });
  },
};
