const { ObjectId } = require("mongodb");

module.exports = {
  async up(db) {
    const existingIndexes = await db.collection("demo_chunks").indexes();
    const indexNames = existingIndexes.map((i) => i.name);
    for (const name of [
      "demo_id_1", "demo_id_1_chunk_index_1", "demo_id_1_start_tick_1_end_tick_1",
      "match_id_1", "match_id_1_chunk_index_1", "match_id_1_start_tick_1_end_tick_1",
    ]) {
      if (indexNames.includes(name)) {
        await db.collection("demo_chunks").dropIndex(name);
      }
    }

    const cursor = db
      .collection("demo_chunks")
      .find({ demo_id: { $exists: true } }, { projection: { _id: 1, demo_id: 1 } });

    for await (const chunk of cursor) {
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

    await db.collection("demo_chunks").createIndex({ match_id: 1 }, { sparse: true });
    await db.collection("demo_chunks").createIndex(
      { match_id: 1, chunk_index: 1 },
      { unique: true, partialFilterExpression: { match_id: { $exists: true } } },
    );
    await db.collection("demo_chunks").createIndex(
      { match_id: 1, start_tick: 1, end_tick: 1 },
      { partialFilterExpression: { match_id: { $exists: true } } },
    );
  },

  async down(db) {
    const existingIndexes = await db.collection("demo_chunks").indexes();
    const indexNames = existingIndexes.map((i) => i.name);
    for (const name of ["match_id_1", "match_id_1_chunk_index_1", "match_id_1_start_tick_1_end_tick_1"]) {
      if (indexNames.includes(name)) {
        await db.collection("demo_chunks").dropIndex(name);
      }
    }

    const cursor = db
      .collection("demo_chunks")
      .find({ match_id: { $exists: true } }, { projection: { _id: 1, match_id: 1 } });

    for await (const chunk of cursor) {
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

    await db.collection("demo_chunks").createIndex({ demo_id: 1 }, { sparse: true });
    await db.collection("demo_chunks").createIndex(
      { demo_id: 1, chunk_index: 1 },
      { unique: true, partialFilterExpression: { demo_id: { $exists: true } } },
    );
    await db.collection("demo_chunks").createIndex(
      { demo_id: 1, start_tick: 1, end_tick: 1 },
      { partialFilterExpression: { demo_id: { $exists: true } } },
    );
  },
};
