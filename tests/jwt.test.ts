import { describe, it, expect, afterEach } from "vitest";
import { signJwt, verifyJwt } from "@/lib/doctor/lib/jwt";

const original = process.env.JWT_SECRET;
afterEach(() => {
  process.env.JWT_SECRET = original;
});

describe("doctor jwt helpers", () => {
  it("round-trips a payload", async () => {
    const token = await signJwt({ sub: "d1", role: "doctor" });
    await expect(verifyJwt(token)).resolves.toMatchObject({ sub: "d1", role: "doctor" });
  });

  it("refuses to sign or verify when JWT_SECRET is missing (no default secret)", async () => {
    delete process.env.JWT_SECRET;
    await expect(signJwt({ sub: "d1" })).rejects.toThrow("JWT_SECRET");
    await expect(verifyJwt("x.y.z")).rejects.toThrow("JWT_SECRET");
  });
});
