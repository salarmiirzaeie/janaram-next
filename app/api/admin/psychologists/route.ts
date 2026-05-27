import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { avatarApiUrl } from "@/lib/storage-url";

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending, approved, rejected
    const search = searchParams.get("search");

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    let filter: any = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { medicalLicenseNumber: { $regex: search, $options: "i" } },
      ];
    }

    const docs = await psychologists
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const list = docs.map(({ _id, password, avatar, ...rest }) => ({
      id: _id.toString(),
      ...rest,
      avatar: avatarApiUrl(avatar as string | null),
    }));

    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    console.error("Error fetching doctors for admin:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
