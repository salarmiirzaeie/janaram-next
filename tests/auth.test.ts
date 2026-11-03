import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { verifyToken } from "@/lib/auth";

const SECRET = process.env.JWT_SECRET!;

describe("verifyToken", () => {
  it("returns the payload for a valid token", () => {
    const token = jwt.sign({ sub: "u1", role: "admin" }, SECRET);
    expect(verifyToken(token)).toMatchObject({ sub: "u1", role: "admin" });
  });

  it("returns null for a token signed with another secret", () => {
    const token = jwt.sign({ sub: "u1" }, "another-secret");
    expect(verifyToken(token)).toBeNull();
  });

  it("returns null for an expired token", () => {
    const token = jwt.sign({ sub: "u1" }, SECRET, { expiresIn: -10 });
    expect(verifyToken(token)).toBeNull();
  });

  it("returns null for garbage and for an unsigned (alg=none) token", () => {
    expect(verifyToken("not-a-token")).toBeNull();
    const none = jwt.sign({ sub: "u1", role: "admin" }, "", { algorithm: "none" } as any);
    expect(verifyToken(none)).toBeNull();
  });
});
