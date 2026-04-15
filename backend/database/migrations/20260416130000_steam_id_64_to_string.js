const BATCH_SIZE = 100;

/**
 * Converts a value to string if it is a BSON Long (or any object with a toString method
 * that is not a plain string/number/boolean).
 */
function longToString(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') return val;
  // BSON Long objects have a low/high property and a toString() method
  if (typeof val === 'object' && typeof val.toString === 'function') {
    return val.toString();
  }
  // Plain JS number (shouldn't happen for steam IDs, but handle gracefully)
  if (typeof val === 'number') return String(val);
  return val;
}

/**
 * Converts all *_steam_id_64 keys inside an event's data map from Long to string.
 */
function normalizeEventData(data) {
  if (!data || typeof data !== 'object') return data;
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (key.endsWith('steam_id_64')) {
      result[key] = longToString(result[key]);
    }
  }
  return result;
}

module.exports = {
  async up(db) {
    const collection = db.collection('demo_chunks');
    const cursor = collection.find({});

    let ops = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      const newFrames = doc.frames.map((frame) => {
        const newPlayerStates = (frame.player_states || []).map((ps) => ({
          ...ps,
          steam_id_64: longToString(ps.steam_id_64),
        }));

        const newReconnections = (frame.reconnections || []).map((r) => ({
          ...r,
          steam_id_64: longToString(r.steam_id_64),
        }));

        const newEvents = (frame.events || []).map((ev) => ({
          ...ev,
          data: normalizeEventData(ev.data),
        }));

        return {
          ...frame,
          player_states: newPlayerStates,
          reconnections: newReconnections,
          events: newEvents,
        };
      });

      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { frames: newFrames } },
        },
      });

      if (ops.length >= BATCH_SIZE) {
        await collection.bulkWrite(ops, { ordered: false });
        ops = [];
      }
    }

    if (ops.length > 0) {
      await collection.bulkWrite(ops, { ordered: false });
    }
  },

  async down(db) {
    const { Long } = require('mongodb');
    const collection = db.collection('demo_chunks');
    const cursor = collection.find({});

    let ops = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      const newFrames = doc.frames.map((frame) => {
        const newPlayerStates = (frame.player_states || []).map((ps) => ({
          ...ps,
          steam_id_64: typeof ps.steam_id_64 === 'string' ? Long.fromString(ps.steam_id_64) : ps.steam_id_64,
        }));

        const newReconnections = (frame.reconnections || []).map((r) => ({
          ...r,
          steam_id_64: typeof r.steam_id_64 === 'string' ? Long.fromString(r.steam_id_64) : r.steam_id_64,
        }));

        const newEvents = (frame.events || []).map((ev) => {
          const newData = { ...(ev.data || {}) };
          for (const key of Object.keys(newData)) {
            if (key.endsWith('steam_id_64') && typeof newData[key] === 'string') {
              newData[key] = Long.fromString(newData[key]);
            }
          }
          return { ...ev, data: newData };
        });

        return {
          ...frame,
          player_states: newPlayerStates,
          reconnections: newReconnections,
          events: newEvents,
        };
      });

      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { frames: newFrames } },
        },
      });

      if (ops.length >= BATCH_SIZE) {
        await collection.bulkWrite(ops, { ordered: false });
        ops = [];
      }
    }

    if (ops.length > 0) {
      await collection.bulkWrite(ops, { ordered: false });
    }
  },
};
