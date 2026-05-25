import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request, { params }) {
  const { path: pathSegments } = await params;
  const assetPath = pathSegments.join("/");
  const { searchParams } = new URL(request.url);
  const runtimeVersion = searchParams.get("runtimeVersion");

  if (!runtimeVersion) {
    return NextResponse.json(
      { error: "runtimeVersion is required" },
      { status: 400 }
    );
  }

  const fullAssetPath = path.join(
    process.cwd(),
    "public",
    "updates",
    runtimeVersion,
    "assets",
    assetPath
  );

  console.log(`🖼️  Asset request: ${fullAssetPath}`);

  if (!fs.existsSync(fullAssetPath)) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const assetBuffer = fs.readFileSync(fullAssetPath);
  const ext = path.extname(assetPath).toLowerCase();

  const contentType =
    {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".ttf": "font/ttf",
      ".hbc": "application/octet-stream",
    }[ext] || "application/octet-stream";

  return new NextResponse(assetBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
