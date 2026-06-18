module.exports = {
  async up(db) {
    await db.command({
      collMod: "player_accuracy",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["stats_id"],
          properties: {
            stats_id: { bsonType: "objectId" },
            total_shots: { bsonType: "int" },
            total_hits: { bsonType: "int" },
            headshots: { bsonType: "int" },
            top_level_accuracy: { bsonType: "decimal" },
            hit_breakdown: {
              bsonType: "object",
              properties: {
                head: { bsonType: "int" },
                chest: { bsonType: "int" },
                stomach: { bsonType: "int" },
                left_arm: { bsonType: "int" },
                right_arm: { bsonType: "int" },
                left_leg: { bsonType: "int" },
                right_leg: { bsonType: "int" },
                neck: { bsonType: "int" },
                generic: { bsonType: "int" },
                gear: { bsonType: "int" },
                unknown: { bsonType: "int" },
              },
            },
            date_recorded: { bsonType: "date" },
          },
        },
      },
      validationAction: "warn",
    });

    await db.command({
      collMod: "player_reaction",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["stats_id"],
          properties: {
            stats_id: { bsonType: "objectId" },
            avg_ttr: { bsonType: "decimal" },
            min_ttr: { bsonType: "decimal" },
            max_ttr: { bsonType: "decimal" },
            min_ttr_game_round: { bsonType: "long" },
            max_ttr_game_round: { bsonType: "long" },
            date_recorded: { bsonType: "date" },
          },
        },
      },
      validationAction: "warn",
    });

    await db.command({
      collMod: "player_behavior",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["stats_id"],
          properties: {
            stats_id: { bsonType: "objectId" },
            aggression_signal: { bsonType: "decimal" },
            lurking_signal: { bsonType: "decimal" },
            support_signal: { bsonType: "decimal" },
            avg_engagement_distance: { bsonType: "decimal" },
            avg_engagement_accuracy: { bsonType: "decimal" },
            role: { bsonType: "string" },
            confidence: { bsonType: "decimal" },
            date_recorded: { bsonType: "date" },
          },
        },
      },
      validationAction: "warn",
    });

    await db.command({
      collMod: "player_clutches",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          properties: {
            stats_id: { bsonType: "objectId" },
            clutch_1v1: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
            clutch_1v2: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
            clutch_1v3: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
            clutch_1v4: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
            clutch_1v5: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
          },
        },
      },
      validationAction: "warn",
    });
  },

  async down(db) {
    await db.command({
      collMod: "player_accuracy",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["stats_id"],
          properties: {
            stats_id: { bsonType: "string" },
            total_shots: { bsonType: "int" },
            total_hits: { bsonType: "int" },
            headshots: { bsonType: "int" },
            top_level_accuracy: { bsonType: "decimal" },
            hit_breakdown: {
              bsonType: "object",
              properties: {
                head: { bsonType: "int" },
                chest: { bsonType: "int" },
                stomach: { bsonType: "int" },
                arms: { bsonType: "int" },
                legs: { bsonType: "int" },
              },
            },
            date_recorded: { bsonType: "date" },
          },
        },
      },
      validationAction: "warn",
    });

    await db.command({
      collMod: "player_reaction",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["stats_id"],
          properties: {
            stats_id: { bsonType: "string" },
            avg_ttr: { bsonType: "decimal" },
            min_ttr: { bsonType: "decimal" },
            max_ttr: { bsonType: "decimal" },
            min_ttr_game_round: { bsonType: "long" },
            max_ttr_game_round: { bsonType: "long" },
            date_recorded: { bsonType: "date" },
          },
        },
      },
      validationAction: "warn",
    });

    await db.command({
      collMod: "player_behavior",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["stats_id"],
          properties: {
            stats_id: { bsonType: "string" },
            aggression_signal: { bsonType: "decimal" },
            lurking_signal: { bsonType: "decimal" },
            support_signal: { bsonType: "decimal" },
            avg_engagement_distance: { bsonType: "decimal" },
            avg_engagement_accuracy: { bsonType: "decimal" },
            role: { bsonType: "string" },
            confidence: { bsonType: "decimal" },
            date_recorded: { bsonType: "date" },
          },
        },
      },
      validationAction: "warn",
    });

    await db.command({
      collMod: "player_clutches",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["stats_id"],
          properties: {
            stats_id: { bsonType: "string" },
            clutch_1v1: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
            clutch_1v2: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
            clutch_1v3: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
            clutch_1v4: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
            clutch_1v5: {
              bsonType: "object",
              properties: {
                attempted: { bsonType: "int" },
                won: { bsonType: "int" },
              },
            },
          },
        },
      },
      validationAction: "warn",
    });
  },
};
