module.exports = {
  async up(db) {
    const users = db.collection("users");

    // Drop any leftover index from a previous partial run before recreating as sparse
    try {
      await users.dropIndex("latest_known_share_code_1");
    } catch (_) {}

    // Create sparse unique index before setting null values — sparse excludes nulls from uniqueness checks
    await users.createIndex(
      { latest_known_share_code: 1 },
      { unique: true, sparse: true },
    );

    await users.updateMany(
      { steam_id_key: { $exists: false } },
      {
        $set: { steam_id_key: "" },
        $unset: {
          latest_known_share_code: "",
          initial_known_share_code: "",
          share_code_verified_at: "",
        },
      },
    );
  },

  async down(db) {
    const users = db.collection("users");

    await users.updateMany(
      {},
      {
        $unset: {
          steam_id_key: null,
          initial_known_share_code: null,
          latest_known_share_code: null,
          share_code_verified_at: null,
        },
      },
    );

    await users.dropIndex(
      { latest_known_share_code: 1 },
      { unique: true, sparse: true },
    );
  },
};
