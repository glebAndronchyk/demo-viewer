module.exports = {
  async up(db, client) {
    // player_accuracy
    await db.createCollection('player_accuracy', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['stats_id'],
          properties: {
            stats_id: { bsonType: 'string' },
            total_shots: { bsonType: 'int' },
            total_hits: { bsonType: 'int' },
            headshots: { bsonType: 'int' },
            top_level_accuracy: { bsonType: 'decimal' },
            hit_breakdown: {
              bsonType: 'object',
              properties: {
                head: { bsonType: 'int' },
                chest: { bsonType: 'int' },
                stomach: { bsonType: 'int' },
                arms: { bsonType: 'int' },
                legs: { bsonType: 'int' },
              },
            },
            date_recorded: { bsonType: 'date' },
          },
        },
      },
      validationAction: 'warn',
    });

    await db.collection('player_accuracy').createIndex({ stats_id: 1 });

    // player_reaction
    await db.createCollection('player_reaction', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['stats_id'],
          properties: {
            stats_id: { bsonType: 'string' },
            avg_ttr: { bsonType: 'decimal' },
            min_ttr: { bsonType: 'decimal' },
            max_ttr: { bsonType: 'decimal' },
            min_ttr_game_round: { bsonType: 'long' },
            max_ttr_game_round: { bsonType: 'long' },
            date_recorded: { bsonType: 'date' },
          },
        },
      },
      validationAction: 'warn',
    });

    await db.collection('player_reaction').createIndex({ stats_id: 1 });

    // player_behavior
    await db.createCollection('player_behavior', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['stats_id'],
          properties: {
            stats_id: { bsonType: 'string' },
            aggression_signal: { bsonType: 'decimal' },
            lurking_signal: { bsonType: 'decimal' },
            support_signal: { bsonType: 'decimal' },
            avg_engagement_distance: { bsonType: 'decimal' },
            avg_engagement_accuracy: { bsonType: 'decimal' },
            role: { bsonType: 'string' },
            confidence: { bsonType: 'decimal' },
            date_recorded: { bsonType: 'date' },
          },
        },
      },
      validationAction: 'warn',
    });

    await db.collection('player_behavior').createIndex({ stats_id: 1 });
  },

  async down(db, client) {
    await db.collection('player_accuracy').drop();
    await db.collection('player_reaction').drop();
    await db.collection('player_behavior').drop();
  },
};
