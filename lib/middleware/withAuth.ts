import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../auth";

export function withAuth(handler: (req: NextRequest, user: any) => Promise<Response>) {
  return async function (req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1]; // Expect: Bearer <token>

    if (!token) {
      return NextResponse.json({ success: false, message: "توکن ارسال نشده است" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: "توکن نامعتبر است" }, { status: 401 });
    }

    return handler(req, user);
  };
}
