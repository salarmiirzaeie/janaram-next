import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "../jwt";

type RouteContext = { params: Promise<Record<string, string>> };

export function withDoctorAuth(
  handler: (
    req: NextRequest,
    doctor: any,
    params?: Record<string, string>
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { success: false, message: "توکن ارائه نشده است" },
          { status: 401 }
        );
      }

      const token = authHeader.split(" ")[1];
      const decoded = await verifyJwt(token);

      if (decoded.role !== "doctor") {
        return NextResponse.json(
          { success: false, message: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }

      const params = context?.params ? await context.params : undefined;
      return handler(req, decoded, params);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر است" },
        { status: 401 }
      );
    }
  };
}
