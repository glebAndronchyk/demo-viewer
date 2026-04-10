module.exports = {
  async up(db) {
    const users = db.collection("users");

    await users.updateMany(
      { steam_id_key: { $exists: false } },
      {
        $set: {
          steam_id_key: "",
          latest_known_share_code: null,
          initial_known_share_code: null,
          share_code_verified_at: null,
        },
      },
    );

    // Create demo_id sparse unique index (sparse avoids conflict with empty-string legacy docs)
    await users.createIndex(
      { latest_known_share_code: 1 },
      { unique: true, sparse: true },
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
