import { connectToDatabase } from "@/services/db/connect";

// rbac-api-security.T08: the one place the real app actually opens its
// MongoDB connection. Tests never go through this — they connect Mongoose
// directly to an in-memory mongodb-memory-server instance instead (see
// src/test-utils/mongoServer.ts). A connection failure here is left to
// propagate and crash server startup, matching connectToDatabase()'s own
// fail-fast behavior — never silently degraded.
export async function register() {
  await connectToDatabase();
}
