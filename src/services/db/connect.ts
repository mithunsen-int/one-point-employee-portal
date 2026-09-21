import mongoose from "mongoose";

let cachedConnection: Promise<typeof mongoose> | null = null;

export function connectToDatabase(): Promise<typeof mongoose> {
  if (!cachedConnection) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set.");
    }
    cachedConnection = mongoose.connect(uri);
  }
  return cachedConnection;
}
