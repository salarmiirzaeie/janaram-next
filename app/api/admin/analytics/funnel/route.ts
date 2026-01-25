// pages/api/admin/analytics/funnel.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const GET = async (req: NextRequest) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const users = db.collection("users");
    const exercises = db.collection("user-exercises");
    const payments = db.collection("payments");

    const totalUsers = await users.countDocuments();
    const startedMeditation = await exercises.countDocuments({
      type: "meditation",
    });
    const completedMeditation = await exercises.countDocuments({
      type: "meditation",
      done: true,
    });
    const paidUsers = await payments.distinct("userId");

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        startedMeditation,
        completedMeditation,
        paidUsers: paidUsers.length,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
};
