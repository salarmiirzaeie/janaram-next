import crypto from "crypto";
import fs from "fs";
import path from "path";

function createHash(file, algorithm, encoding) {
  return crypto.createHash(algorithm).update(file).digest(encoding);
}

function getBase64URLEncoding(base64EncodedString) {
  return base64EncodedString
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function convertSHA256HashToUUID(value) {
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(
    12,
    16
  )}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

export function getUpdatePath(runtimeVersion) {
  return path.join(process.cwd(), "public", "updates", runtimeVersion);
}

export function getMetadata(updatePath) {
  const metadataPath = path.join(updatePath, "metadata.json");
  const metadataBuffer = fs.readFileSync(metadataPath);
  const metadataJson = JSON.parse(metadataBuffer.toString("utf-8"));
  const metadataStat = fs.statSync(metadataPath);
  const id = createHash(metadataBuffer, "sha256", "hex");

  return {
    metadataJson,
    createdAt: metadataStat.birthtime.toISOString(),
    id,
  };
}

function getMimeType(ext) {
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    ttf: "font/ttf",
    json: "application/json",
  };
  return map[ext?.toLowerCase()] || "application/octet-stream";
}

export function getAssetMetadata({
  updatePath,
  filePath,
  ext,
  isLaunchAsset,
  runtimeVersion,
  baseUrl,
}) {
  const assetFilePath = path.join(updatePath, filePath);
  if (!fs.existsSync(assetFilePath)) {
    throw new Error(`Asset not found: ${assetFilePath}`);
  }

  const asset = fs.readFileSync(assetFilePath);
  const assetHash = getBase64URLEncoding(createHash(asset, "sha256", "base64"));
  const key = createHash(asset, "md5", "hex");
  const keyExtensionSuffix = isLaunchAsset ? "bundle" : ext;
  const contentType = isLaunchAsset
    ? "application/javascript"
    : getMimeType(ext);

  const routeSegment = isLaunchAsset ? "bundles" : "assets";
  const urlPath = isLaunchAsset
    ? filePath
    : filePath.replace(/^assets\//, "");

  return {
    hash: assetHash,
    key,
    fileExtension: isLaunchAsset ? undefined : `.${keyExtensionSuffix}`,
    contentType,
    url: `${baseUrl}/api/updates/${routeSegment}/${urlPath}?runtimeVersion=${encodeURIComponent(runtimeVersion)}`,
  };
}

export function buildManifest({ runtimeVersion, platform, baseUrl }) {
  const updatePath = getUpdatePath(runtimeVersion);

  if (!fs.existsSync(updatePath)) {
    throw new Error(`No update folder for runtime version: ${runtimeVersion}`);
  }

  const { metadataJson, createdAt, id } = getMetadata(updatePath);
  const platformData = metadataJson.fileMetadata?.[platform];

  if (!platformData) {
    throw new Error(`Platform ${platform} not found in metadata`);
  }

  const expoConfigPath = path.join(updatePath, "expoConfig.json");
  const expoConfig = fs.existsSync(expoConfigPath)
    ? JSON.parse(fs.readFileSync(expoConfigPath, "utf-8"))
    : {};

  const assets = (platformData.assets || []).map((asset) =>
    getAssetMetadata({
      updatePath,
      filePath: asset.path,
      ext: asset.ext,
      isLaunchAsset: false,
      runtimeVersion,
      baseUrl,
    })
  );

  const launchAsset = getAssetMetadata({
    updatePath,
    filePath: platformData.bundle,
    ext: null,
    isLaunchAsset: true,
    runtimeVersion,
    baseUrl,
  });

  return {
    id: convertSHA256HashToUUID(id),
    createdAt,
    runtimeVersion,
    assets,
    launchAsset,
    metadata: {},
    extra: {
      expoClient: expoConfig,
    },
  };
}
