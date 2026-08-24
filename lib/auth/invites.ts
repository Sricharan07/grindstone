import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";

const scrypt = promisify(scryptCallback);
const HASH_BYTES = 64;
const DUMMY_SALT = "00000000000000000000000000000000";
const DUMMY_HASH = "00".repeat(HASH_BYTES);

const inviteSchema = z.object({
  id: z.uuid(),
  login: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  passwordHash: z.string().regex(/^scrypt\$[a-f0-9]{32,}\$[a-f0-9]{128}$/i),
});

export type InviteAccount = z.infer<typeof inviteSchema>;

export function parseInviteAccounts(raw = process.env.AUTH_INVITES): InviteAccount[] {
  if (!raw) return [];
  try {
    const accounts = z.array(inviteSchema).max(20).parse(JSON.parse(raw));
    const seen = new Set<string>();
    for (const account of accounts) {
      const login = account.login.toLowerCase();
      if (seen.has(login)) throw new Error("Invite logins must be unique");
      seen.add(login);
    }
    return accounts;
  } catch (error) {
    throw new Error("AUTH_INVITES is not valid", { cause: error });
  }
}

async function comparePassword(password: string, encoded: string) {
  const [, salt = DUMMY_SALT, expectedHex = DUMMY_HASH] = encoded.split("$");
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, Buffer.from(salt, "hex"), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function authenticateInvite(login: unknown, password: unknown, accounts = parseInviteAccounts()) {
  const normalizedLogin = typeof login === "string" ? login.trim().toLowerCase() : "";
  const candidate = accounts.find((account) => account.login.toLowerCase() === normalizedLogin);
  const validPassword = typeof password === "string" && password.length >= 16 && password.length <= 256;
  const matches = await comparePassword(validPassword ? password : "invalid-password", candidate?.passwordHash ?? `scrypt$${DUMMY_SALT}$${DUMMY_HASH}`);
  if (!candidate || !validPassword || !matches) return null;
  return { id: candidate.id, name: candidate.name, email: candidate.email };
}

