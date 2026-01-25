// pages/api/admin/analytics/feature-usage.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const GET = async (req: NextRequest) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const exercises = db.collection("user-exercises");

    const featureCounts = await exercises
      .aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }])
      .toArray();

    return NextResponse.json({
      success: true,
      data: featureCounts.map((f) => ({ feature: f._id, count: f.count })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
};
