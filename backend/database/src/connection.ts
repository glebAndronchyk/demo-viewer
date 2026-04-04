import mongoose from "mongoose";

export interface DatabaseConfig {
  uri: string;
  options?: mongoose.ConnectOptions;
}

export type DatabaseConnection = typeof mongoose;

let isConnected = false;

export async function connectDatabase(
  config: DatabaseConfig,
): Promise<DatabaseConnection> {
  if (isConnected) {
    return mongoose;
  }

  try {
    await mongoose.connect(config.uri, {
      ...config.options,
      autoIndex: true,
    });
    isConnected = true;
    console.log("MongoDB connected successfully");
    return mongoose;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("MongoDB disconnected successfully");
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
    throw error;
  }
}

export function getConnection(): typeof mongoose {
  if (!isConnected) {
    throw new Error("Database not connected");
  }
  return mongoose;
}

export type {};
