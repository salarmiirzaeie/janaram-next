import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

const SECRET = process.env.JWT_SECRET!;
const sign = (payload: object) => jwt.sign(payload, SECRET);

function req(token?: string) {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}
const ok = () => vi.fn(async (..._args: any[]) => NextResponse.json({ ok: true }));

describe("withAuth (logged-in users)", () => {
  it("401 without a token", async () => {
    const handler = ok();
    const res = await withAuth(handler)(req());
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("401 with an invalid token", async () => {
    const res = await withAuth(ok())(req("bad"));
    expect(res.status).toBe(401);
  });

  it("calls the handler with the decoded user for a valid token", async () => {
    const handler = ok();
    const res = await withAuth(handler)(req(sign({ sub: "u1" })));
    expect(res.status).toBe(200);
    expect(handler.mock.calls[0][1]).toMatchObject({ sub: "u1" });
  });
});

describe("withAdminAuth (admin panel API)", () => {
  it("401 without a token", async () => {
    const res = await withAdminAuth(ok())(req());
    expect(res.status).toBe(401);
  });

  it("403 for an invalid token", async () => {
    const res = await withAdminAuth(ok())(req("bad"));
    expect(res.status).toBe(403);
  });

  it("403 for a valid token of an ordinary user (regression: role was never checked)", async () => {
    const handler = ok();
    const res = await withAdminAuth(handler)(req(sign({ sub: "u1", phoneNumber: "0912" })));
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("403 for a doctor token", async () => {
    const handler = ok();
    const res = await withAdminAuth(handler)(req(sign({ sub: "d1", role: "doctor" })));
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("allows an admin token", async () => {
    const handler = ok();
    const res = await withAdminAuth(handler)(req(sign({ sub: "a1", role: "admin" })));
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe("withDoctorAuth", () => {
  const ctx = { params: Promise.resolve({ id: "1" }) };

  it("401 without a Bearer header", async () => {
    const res = await withDoctorAuth(ok() as any)(req(), ctx);
    expect(res.status).toBe(401);
  });

  it("403 for a valid token that is not a doctor", async () => {
    const res = await withDoctorAuth(ok() as any)(req(sign({ sub: "u1" })), ctx);
    expect(res.status).toBe(403);
  });

  it("401 for an invalid token", async () => {
    const res = await withDoctorAuth(ok() as any)(req("bad"), ctx);
    expect(res.status).toBe(401);
  });

  it("passes the decoded doctor and route params to the handler", async () => {
    const handler = ok();
    const res = await withDoctorAuth(handler as any)(req(sign({ sub: "d1", role: "doctor" })), ctx);
    expect(res.status).toBe(200);
    expect(handler.mock.calls[0][1]).toMatchObject({ sub: "d1", role: "doctor" });
    expect(handler.mock.calls[0][2]).toEqual({ id: "1" });
  });
});
