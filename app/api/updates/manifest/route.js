import { NextResponse } from "next/server";
import { buildManifest } from "@/lib/expo-updates";

function getBaseUrl(request) {
  if (process.env.UPDATES_BASE_URL) {
    return process.env.UPDATES_BASE_URL.replace(/\/$/, "");
  }
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function GET(request) {
  const runtimeVersion =
    request.headers.get("expo-runtime-version") ||
    new URL(request.url).searchParams.get("runtimeVersion");

  const platform =
    request.headers.get("expo-platform") ||
    new URL(request.url).searchParams.get("platform");

  const protocolVersion = parseInt(
    request.headers.get("expo-protocol-version") || "0",
    10
  );

  console.log("📱 Update request:", { runtimeVersion, platform, protocolVersion });

  if (
    !runtimeVersion ||
    runtimeVersion === "null" ||
    runtimeVersion === "undefined"
  ) {
    return NextResponse.json(
      { error: "runtimeVersion is required" },
      { status: 400 }
    );
  }

  if (platform !== "ios" && platform !== "android") {
    return NextResponse.json(
      { error: "platform must be ios or android" },
      { status: 400 }
    );
  }

  try {
    const manifest = buildManifest({
      runtimeVersion,
      platform,
      baseUrl: getBaseUrl(request),
    });

    console.log(`✅ Manifest for ${runtimeVersion}/${platform}`);
    console.log(`   id: ${manifest.id}`);
    console.log(`   assets: ${manifest.assets.length}`);
    console.log(`   bundle: ${manifest.launchAsset.url}`);

    return NextResponse.json(manifest, {
      headers: {
        "expo-protocol-version": String(protocolVersion),
        "expo-sfv-version": "0",
        "cache-control": "private, max-age=0",
        "content-type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ Manifest error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
