import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { getAdminDailyFinancialReport } from "@/lib/financial";
import { getTodayTehran } from "@/lib/booking";

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || getTodayTehran();

    const db = (await clientPromise).db("janaram-db");
    const report = await getAdminDailyFinancialReport(db, date);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    console.error("Error fetching admin daily financial:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});
