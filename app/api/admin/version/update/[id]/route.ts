import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Version } from "@/lib/types/version";
import { ObjectId } from "mongodb";
import semver from "semver";
import { withAdminAuth } from "@/lib/middleware/withAdmin";

// GET: Fetch version details by ID (optional, for form pre-filling)
export const GET = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const versionId = params.id;
    if (!ObjectId.isValid(versionId)) {
      return NextResponse.json({ success: false, message: "شناسه نسخه نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const versions = db.collection<Version>("versions");
    const versionDoc = await versions.findOne({ _id: new ObjectId(versionId) });

    if (!versionDoc) {
      return NextResponse.json({ success: false, message: "نسخه یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        latestVersion: versionDoc.latestVersion,
        minimumVersion: versionDoc.minimumVersion,
        releaseNotes: versionDoc.releaseNotes || "",
      },
    });
  } catch (err: any) {
    console.error("خطا در دریافت نسخه:", err);
    return NextResponse.json({ success: false, message: "خطای سرور در دریافت نسخه" }, { status: 500 });
  }
});

// PUT: Update an existing version by ID
export const PUT = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const versionId = params.id;
    if (!ObjectId.isValid(versionId)) {
      return NextResponse.json({ success: false, message: "شناسه نسخه نامعتبر است" }, { status: 400 });
    }

    const { latestVersion, minimumVersion, releaseNotes } = await req.json();
    if (!semver.valid(latestVersion) || !semver.valid(minimumVersion)) {
      return NextResponse.json({ success: false, message: "فرمت نسخه نامعتبر است (مثال: 1.2.0)" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const versions = db.collection<Version>("versions");

    const updateResult = await versions.updateOne(
      { _id: new ObjectId(versionId) },
      {
        $set: {
          latestVersion,
          minimumVersion,
          releaseNotes: releaseNotes || "",
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "نسخه یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "نسخه با موفقیت به‌روزرسانی شد",
    });
  } catch (err: any) {
    console.error("خطا در به‌روزرسانی نسخه:", err);
    return NextResponse.json({ success: false, message: "خطای سرور در به‌روزرسانی نسخه" }, { status: 500 });
  }
});
