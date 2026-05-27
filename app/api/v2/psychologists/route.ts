import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import {
  APPROVED_DOCTOR_FILTER,
  getPersianWeekdayNumber,
  getTodayTehran,
} from "@/lib/booking";
import { avatarApiUrl } from "@/lib/storage-url";

function getCategorySpecialty(categoryId: string): string | null {
  const categoryMap: Record<string, string> = {
    individual: "مشاور فردی",
    couple: "زوج درمانی",
    family: "مشاور خانواده",
    children: "روانشناس کودک و نوجوان",
    addiction: "متخصص ترک اعتیاد",
    phobia: "درمانگر فوبیا و استرس",
    sexual: "مشاور جنسی",
  };
  return categoryMap[categoryId] || null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    let filter: Record<string, unknown> = { ...APPROVED_DOCTOR_FILTER };

    if (category && category !== "all") {
      const specialtyTitle = getCategorySpecialty(category);
      const categoryConditions: Record<string, unknown>[] = [
        { categoryId: category },
      ];

      if (specialtyTitle) {
        categoryConditions.push({ specialties: { $in: [specialtyTitle] } });
        categoryConditions.push({ specialty: specialtyTitle });
      }

      filter = {
        $and: [APPROVED_DOCTOR_FILTER, { $or: categoryConditions }],
      };
    }

    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: "i" } },
        { specialty: { $regex: search, $options: "i" } },
        { specialties: { $regex: search, $options: "i" } },
      ];

      if (filter.$and) {
        (filter.$and as unknown[]).push({ $or: searchConditions });
      } else if (filter.$or) {
        filter = {
          $and: [{ $or: filter.$or as unknown[] }, { $or: searchConditions }],
        };
      } else {
        filter = {
          $and: [APPROVED_DOCTOR_FILTER, { $or: searchConditions }],
        };
      }
    }

    const docs = await psychologists.find(filter).toArray();
    const today = getTodayTehran();
    const todayWeekday = getPersianWeekdayNumber(today);

    const list = docs.map(({ _id, schedule, password, avatar, ...rest }) => {
      let availableToday = false;
      const todaySlots =
        schedule?.[todayWeekday] ?? schedule?.[String(todayWeekday)];
      if (Array.isArray(todaySlots) && todaySlots.length > 0) {
        availableToday = true;
      }
      return {
        id: _id.toString(),
        ...rest,
        avatar: avatarApiUrl(avatar as string | null),
        availableToday,
      };
    });

    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    console.error("Error in psychologists API:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
