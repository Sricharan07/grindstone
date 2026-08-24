import { scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { authenticateInvite, parseInviteAccounts } from "./invites";

function fixture(password = "correct-horse-battery-staple") {
  const salt = "0123456789abcdef0123456789abcdef";
  const hash = scryptSync(password, Buffer.from(salt, "hex"), 64).toString("hex");
  return {
    id: "6cd6a32c-44fd-4b51-a687-34b7316a79a7",
    login: "friend-1",
    name: "Friend 1",
    email: "friend-1@grindstone.local",
    passwordHash: `scrypt$${salt}$${hash}`,
  };
}

describe("private invite authentication", () => {
  it("accepts a valid login without returning the password hash", async () => {
    const account = fixture();
    await expect(authenticateInvite(" FRIEND-1 ", "correct-horse-battery-staple", [account])).resolves.toEqual({
      id: account.id,
      name: account.name,
      email: account.email,
    });
  });

  it("rejects invalid and short passwords", async () => {
    const account = fixture();
    await expect(authenticateInvite("friend-1", "incorrect-password-value", [account])).resolves.toBeNull();
    await expect(authenticateInvite("friend-1", "too-short", [account])).resolves.toBeNull();
  });

  it("rejects malformed configuration and duplicate logins", () => {
    expect(() => parseInviteAccounts("not-json")).toThrow("AUTH_INVITES is not valid");
    const account = fixture();
    expect(() => parseInviteAccounts(JSON.stringify([account, { ...account, id: "b211508d-b0ca-488b-bc95-c727ebc3e0d5" }]))).toThrow("AUTH_INVITES is not valid");
  });
});

