import type { Db } from "mongodb";

const SETTINGS_ID = "financial";

export type PlatformFinancialSettings = {
  /** 0–1 fraction kept by platform; 0 = doctor gets 100% */
  commissionRate: number;
  updatedAt?: Date;
  updatedBy?: string;
};

const DEFAULT: PlatformFinancialSettings = {
  commissionRate: 0,
};

export function formatCommissionPercent(rate: number): string {
  const pct = Math.round(rate * 100);
  return `${pct.toLocaleString("fa-IR")}٪`;
}

export function getDoctorSharePercentLabel(rate: number): string {
  return formatCommissionPercent(1 - rate);
}

export function getCommissionPercentLabel(rate: number): string {
  return formatCommissionPercent(rate);
}

export async function getPlatformFinancialSettings(
  db: Db
): Promise<PlatformFinancialSettings> {
  const doc = await db.collection("platform_settings").findOne({ _id: SETTINGS_ID });
  if (!doc || typeof doc.commissionRate !== "number") {
    return { ...DEFAULT };
  }
  const rate = Math.min(1, Math.max(0, doc.commissionRate));
  return {
    commissionRate: rate,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
  };
}

export async function getPlatformCommissionRate(db: Db): Promise<number> {
  const s = await getPlatformFinancialSettings(db);
  return s.commissionRate;
}

export async function setPlatformCommissionRate(
  db: Db,
  commissionRate: number,
  adminSub?: string
): Promise<PlatformFinancialSettings> {
  const rate = Math.min(1, Math.max(0, commissionRate));
  await db.collection("platform_settings").updateOne(
    { _id: SETTINGS_ID },
    {
      $set: {
        commissionRate: rate,
        updatedAt: new Date(),
        updatedBy: adminSub || null,
      },
    },
    { upsert: true }
  );
  return getPlatformFinancialSettings(db);
}
