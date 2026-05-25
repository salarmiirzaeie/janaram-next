import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const tests = db.collection("tests");

    // فقط فیلدهای مورد نیاز برای لیست: به جز سوالات
    const allTests = await tests
      .find(
        {},
        {
          projection: {
            questions: 0, // حذف سوالات
            _id: 0,
          },
        }
      )
      .toArray();

    return NextResponse.json({
      success: true,
      data: allTests,
    });
  } catch (err) {
    console.error("Error fetching tests list:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
