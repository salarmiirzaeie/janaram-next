// lib/withAdminAuth.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../auth";

export function withAdminAuth(handler: (req: NextRequest, admin: any) => Promise<Response>) {
  return async function (req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ success: false, message: "توکن ارسال نشده است" }, { status: 401 });
    }

    const admin = verifyToken(token);
    if (!admin) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز: فقط ادمین‌ها مجاز هستند" }, { status: 403 });
    }

    return handler(req, admin);
  };
}
