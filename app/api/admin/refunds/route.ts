import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { listPendingRefunds } from "@/lib/refunds-admin";

export const GET = withAdminAuth(async () => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const data = await listPendingRefunds(db);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error listing pending refunds:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});
