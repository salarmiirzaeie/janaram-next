// pages/api/admin/analytics/arpu.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import moment from "moment-timezone";

export const GET = async (req: NextRequest) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const payments = db.collection("payments");
    const users = db.collection("users");

    const days = 30;
    const today = moment.tz("Asia/Tehran").startOf("day");
    const arpuData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = today.clone().subtract(i, "days").format("YYYY-MM-DD");
      const dayPayments = await payments.find({ date }).toArray();

      const dayUsers = await users
        .find({ createdAt: { $lte: new Date(date) } })
        .toArray();

      const revenue = dayPayments.reduce((sum, p) => sum + p.amount, 0);
      const arpu = dayUsers.length ? revenue / dayUsers.length : 0;

      arpuData.push({ date, arpu });
    }

    return NextResponse.json({ success: true, data: arpuData });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
};
