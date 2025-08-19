// app/api/version/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import semver from "semver"; // For version comparison
import { Version } from "@/lib/types/version";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const clientVersion = searchParams.get("version"); // Client sends version as query param
    if (!clientVersion) {
      return NextResponse.json({ success: false, message: "نسخه کلاینت الزامی است" }, { status: 400 });
    }

    // Validate version format (basic check)
    if (!semver.valid(clientVersion)) {
      return NextResponse.json({ success: false, message: "فرمت نسخه نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const versions = db.collection<Version>("versions");

    // Fetch the latest version document
    const versionDoc = await versions.findOne({}, { sort: { updatedAt: -1 } });
    if (!versionDoc) {
      return NextResponse.json({ success: false, message: "اطلاعات نسخه یافت نشد" }, { status: 404 });
    }

    const { latestVersion, minimumVersion, releaseNotes } = versionDoc;

    // Compare versions
    const isNewVersionAvailable = semver.gt(latestVersion, clientVersion);
    const isUpdateMandatory = semver.lt(clientVersion, minimumVersion);

    return NextResponse.json({
      success: true,
      data: {
        latestVersion,
        isNewVersionAvailable,
        isUpdateMandatory,
        releaseNotes: releaseNotes || "هیچ یادداشت نسخه‌ای موجود نیست",
      },
    });
  } catch (err: any) {
    console.error("خطا در بررسی نسخه:", err);
    return NextResponse.json({ success: false, message: "خطای سرور در بررسی نسخه" }, { status: 500 });
  }
};
