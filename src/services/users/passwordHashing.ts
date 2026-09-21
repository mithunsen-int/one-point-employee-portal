import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword(rawPassword: string): Promise<string> {
  return bcrypt.hash(rawPassword, SALT_ROUNDS);
}
