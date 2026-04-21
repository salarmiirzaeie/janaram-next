import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    const db = (await clientPromise).db("janaram-db");
    const tests = db.collection("tests");

    const test = await tests.findOne({ test_id: id });

    if (!test) {
      return NextResponse.json(
        { success: false, message: "تست پیدا نشد" },
        { status: 404 }
      );
    }

    // حذف _id از پاسخ (اختیاری)
    const { _id, ...testWithoutId } = test;

    return NextResponse.json({
      success: true,
      data: testWithoutId,
    });
  } catch (err) {
    console.error("Error fetching test:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
