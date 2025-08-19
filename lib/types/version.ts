// lib/types/version.ts
export interface Version {
  _id?: import("mongodb").ObjectId;
  latestVersion: string; // e.g., "1.2.0"
  minimumVersion: string; // e.g., "1.0.0" (below this, update is mandatory)
  releaseNotes?: string; // Optional notes about the latest version
  updatedAt: Date;
}
