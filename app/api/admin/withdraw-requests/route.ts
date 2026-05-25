import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const db = (await clientPromise).db("janaram-db");
    const withdrawRequests = db.collection("withdraw_requests");
    const psychologists = db.collection("psychologists");

    const filter: Record<string, unknown> = {};
    if (status !== "all") {
      filter.status = status;
    }

    const requests = await withdrawRequests
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await withdrawRequests.countDocuments(filter);

    const doctorIds = [...new Set(requests.map((r) => r.doctorId))];
    const doctors = await psychologists
      .find({ _id: { $in: doctorIds.map((id) => new ObjectId(id)) } })
      .project({ name: 1, phone: 1 })
      .toArray();

    const doctorMap = new Map(
      doctors.map((d) => [
        d._id.toString(),
        { name: d.name, phone: d.phone },
      ])
    );

    const formatted = requests.map((r) => ({
      id: r._id.toString(),
      doctorId: r.doctorId,
      doctor: doctorMap.get(r.doctorId) || { name: "نامشخص", phone: "" },
      amount: r.amount,
      status: r.status,
      bankAccount: r.bankAccount,
      rejectionReason: r.rejectionReason || null,
      createdAt: r.createdAt,
      processedAt: r.processedAt || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        requests: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error("Error listing withdraw requests:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
