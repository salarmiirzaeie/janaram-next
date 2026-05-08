import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Get current day index in Iran timezone (Sunday = 0, Monday = 1, ..., Saturday = 6)
function getCurrentDayIndexInIran(): number {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Tehran",
    weekday: "short",
  };
  const weekdayName = new Intl.DateTimeFormat("en-US", options).format(now);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return weekdayMap[weekdayName] ?? now.getDay();
}

// تبدیل categoryId به عنوان تخصص برای جستجو در specialties
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

    let filter: any = {};

    // فیلتر ترکیبی: هم دسته‌بندی اصلی (categoryId) و هم تخصص‌ها (specialties)
    if (category && category !== "all") {
      const specialtyTitle = getCategorySpecialty(category);

      // ایجاد شرط OR برای جستجو در هر دو فیلد
      const categoryConditions = [];

      // شرط 1: جستجو در categoryId (دسته‌بندی اصلی)
      categoryConditions.push({ categoryId: category });

      // شرط 2: جستجو در specialties (آرایه تخصص‌ها)
      if (specialtyTitle) {
        categoryConditions.push({ specialties: { $in: [specialtyTitle] } });
      }

      // شرط 3: جستجو در specialty (فیلد قدیمی)
      if (specialtyTitle) {
        categoryConditions.push({ specialty: specialtyTitle });
      }

      filter.$or = categoryConditions;
    }

    if (search) {
      // اگر قبلاً شرط $or داریم، باید با شرط جستجو ترکیب کنیم
      const searchConditions = [
        { name: { $regex: search, $options: "i" } },
        { specialty: { $regex: search, $options: "i" } },
        { specialties: { $regex: search, $options: "i" } },
      ];

      if (filter.$or) {
        // ترکیب شرط دسته‌بندی و شرط جستجو با $and
        filter = {
          $and: [{ $or: filter.$or }, { $or: searchConditions }],
        };
      } else {
        filter.$or = searchConditions;
      }
    }

    const docs = await psychologists.find(filter).toArray();
    const todayIndex = getCurrentDayIndexInIran();

    const list = docs.map(({ _id, schedule, ...rest }) => {
      let availableToday = false;
      if (
        schedule &&
        Array.isArray(schedule[todayIndex]) &&
        schedule[todayIndex].length > 0
      ) {
        availableToday = true;
      }
      return {
        id: _id.toString(),
        ...rest,
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
