import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { recordDoctorSettlement } from "@/lib/financial";
import { getTodayTehran } from "@/lib/booking";

export const POST = withAdminAuth(async (req: NextRequest, admin: any) => {
  try {
    const { doctorId, amount, note, settlementDate } = await req.json();

    if (!doctorId || !amount) {
      return NextResponse.json(
        { success: false, message: "شناسه روانشناس و مبلغ الزامی است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const result = await recordDoctorSettlement(db, {
      doctorId,
      amount: Number(amount),
      note,
      adminId: admin?.sub || admin?.id || "admin",
      settlementDate: settlementDate || getTodayTehran(),
    });

    return NextResponse.json({
      success: true,
      message: "تسویه با موفقیت ثبت شد",
      data: result,
    });
  } catch (err: any) {
    console.error("Error recording settlement:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 400 }
    );
  }
});

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const db = (await clientPromise).db("janaram-db");
    const settlements = db.collection("settlements");

    const filter: Record<string, unknown> = { status: "paid" };
    if (date) filter.settlementDate = date;

    const list = await settlements
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await settlements.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
        settlements: list.map((s) => ({
          id: s._id.toString(),
          doctorId: s.doctorId,
          doctorName: s.doctorName,
          amount: s.amount,
          settlementDate: s.settlementDate,
          note: s.note,
          referenceId: s.referenceId,
          bankAccount: s.bankAccount,
          paidAt: s.paidAt,
        })),
        pagination: { page, limit, total },
      },
    });
  } catch (err: any) {
    console.error("Error listing settlements:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
