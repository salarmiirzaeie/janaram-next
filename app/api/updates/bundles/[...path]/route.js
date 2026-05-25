import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request, { params }) {
  const { path: pathSegments } = await params;
  const bundlePath = pathSegments.join("/");
  const { searchParams } = new URL(request.url);
  const runtimeVersion = searchParams.get("runtimeVersion");

  if (!runtimeVersion) {
    return NextResponse.json(
      { error: "runtimeVersion is required" },
      { status: 400 }
    );
  }

  const fullBundlePath = path.join(
    process.cwd(),
    "public",
    "updates",
    runtimeVersion,
    bundlePath
  );

  console.log(`📦 Bundle request: ${fullBundlePath}`);

  if (!fs.existsSync(fullBundlePath)) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  const bundleBuffer = fs.readFileSync(fullBundlePath);
  const ext = path.extname(bundlePath).toLowerCase();
  const contentType =
    ext === ".hbc" ? "application/octet-stream" : "application/javascript";

  return new NextResponse(bundleBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
