module.exports = {
  async up(db) {
    const matches = db.collection('matches');

    // Backfill new header fields with empty/zero defaults for existing records
    await matches.updateMany(
      { demo_id: { $exists: false } },
      {
        $set: {
          demo_id: '',
          map_name: '',
          server_name: '',
          client_name: '',
          duration: 0,
          tick_rate: 0,
          frame_rate: 0,
          signon_length: 0,
          playback_ticks: 0,
          playback_frames: 0,
          parsed_at: '',
        },
      }
    );

    // Backfill is_bot on all existing participant subdocuments
    await matches.updateMany(
      { 'participants.is_bot': { $exists: false } },
      { $set: { 'participants.$[].is_bot': false } }
    );

    // Create demo_id sparse unique index (sparse avoids conflict with empty-string legacy docs)
    await matches.createIndex({ demo_id: 1 }, { unique: true, sparse: true });

    // Create map_name index
    await matches.createIndex({ map_name: 1 });
  },

  async down(db) {
    const matches = db.collection('matches');

    // Remove new header fields
    await matches.updateMany(
      {},
      {
        $unset: {
          demo_id: '',
          map_name: '',
          server_name: '',
          client_name: '',
          duration: '',
          tick_rate: '',
          frame_rate: '',
          signon_length: '',
          playback_ticks: '',
          playback_frames: '',
          parsed_at: '',
        },
      }
    );

    // Remove is_bot from participants
    await matches.updateMany(
      {},
      { $unset: { 'participants.$[].is_bot': '' } }
    );

    // Drop indexes
    await matches.dropIndex({ demo_id: 1 }).catch(() => {});
    await matches.dropIndex({ map_name: 1 }).catch(() => {});
  },
};
