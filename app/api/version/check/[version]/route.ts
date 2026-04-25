// app/api/version/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Version } from "@/lib/types/version";
import semver from "semver"; // For version comparison

export const GET = async (req: NextRequest) => {
  try {
    const version = req.nextUrl.pathname.split("/").pop(); // Extract version from URL
    const currentVersion = "1.2.2";

    // Check if version is provided and valid
    if (!version || version.trim() === "") {
      return NextResponse.json(
        { success: false, message: "نسخه کلاینت الزامی است" },
        { status: 400 }
      );
    }

    // Validate semver format
    if (!semver.valid(version)) {
      return NextResponse.json(
        { success: false, message: "نسخه کلاینت نامعتبر است" },
        { status: 400 }
      );
    }

    // Check if a newer version is available (server version > client version)
    const isNewVersionAvailable = semver.gt(currentVersion, version);

    return NextResponse.json({
      success: true,
      message: "درخواست با موفقیت پردازش شد",
      isNewVersionAvailable,
      currentVersion, // Optionally include server's current version
    });
  } catch (err: any) {
    console.error("خطا در بررسی نسخه:", err.message);
    return NextResponse.json(
      { success: false, message: `خطای سرور: ${err.message}` },
      { status: 500 }
    );
  }
};
