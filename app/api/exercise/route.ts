// pages/api/user-exercises.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import { ObjectId } from "mongodb";
import { Meditation } from "@/lib/types/meditation";
import moment from "moment-timezone";

type UserExerciseType =
  | "meditation"
  | "breathing"
  | "text-activity"
  | "step-activity"
  | "chatbot";

interface UserExercise {
  _id: string;
  type: UserExerciseType;
  exerciseId: string; // اگر مدیتیشن یا breathing، ObjectId رشته‌ای
  title: string;
  description?: string;
  duration?: number;
  done: boolean;
  url?: string; // برای مدیتیشن و تنفس
  imageUrl?: string; // برای مدیتیشن و تنفس
  isPro?: boolean;
}

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");

    const today = moment.tz("Asia/Tehran").format("YYYY-MM-DD");
    const userId = new ObjectId(user.sub);

    const exercisesCollection = db.collection("user-exercises");
    const meditationCollection = db.collection<Meditation>("meditations");
    const breathingCollection = db.collection<Meditation>("breathing");

    const exercises = await exercisesCollection
      .find({ userId, date: today })
      .toArray();

    const detailedExercises: UserExercise[] = [];

    for (const ex of exercises) {
      switch (ex.type) {
        case "meditation": {
          const meditation = await meditationCollection.findOne({
            _id: new ObjectId(ex.exerciseId),
          });
          if (meditation) {
            detailedExercises.push({
              _id: ex._id.toString(),
              type: "meditation",
              exerciseId: ex.exerciseId,
              title: meditation.title,
              description: meditation.description,
              duration: meditation.duration,
              url: meditation.url,
              imageUrl: meditation.imageUrl,
              done: ex.done,
              isPro: ex.isPro,
            });
          }
          break;
        }

        case "breathing": {
          const breathing = await breathingCollection.findOne({
            _id: new ObjectId(ex.exerciseId),
          });
          if (breathing) {
            detailedExercises.push({
              _id: ex._id.toString(),
              type: "breathing",
              exerciseId: ex.exerciseId,
              title: breathing.title,
              description: breathing.description,
              duration: breathing.duration,
              url: breathing.url,
              imageUrl: breathing.imageUrl,
              done: ex.done,
              isPro: ex.isPro,
            });
          }
          break;
        }

        case "text-activity":
        case "step-activity":
        case "chatbot": {
          const task = taskDetails[ex.exerciseId] || {
            title: ex.exerciseId,
            duration: 5,
            description: "",
          };
          detailedExercises.push({
            _id: ex._id.toString(),
            type: ex.type,
            exerciseId: ex.exerciseId,
            title: task.title,
            description: task.description,
            duration: task.duration,
            done: ex.done,
          });
          break;
        }

        default:
          console.warn("Unknown exercise type:", ex);
      }
    }

    return NextResponse.json({
      success: true,
      data: detailedExercises,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});

// همه تمرین‌های متنی و مرحله‌ای و چت بات
const taskDetails: Record<
  string,
  { title: string; duration: number; description: string }
> = {
  // متن
  daily_tip: {
    title: "نکته روز",
    duration: 2,
    description: "یک نکته کوتاه روانشناسی",
  },
  journaling: {
    title: "نوشتن افکار",
    duration: 8,
    description: "نوشتن درباره احساسات روزانه",
  },
  gratitude_exercise: {
    title: "تمرین شکرگزاری",
    duration: 5,
    description: "نوشتن ۳ چیز برای قدردانی امروز",
  },

  // مرحله‌ای
  mindful_activity: {
    title: "تمرین ذهن‌آگاهی",
    duration: 7,
    description: "تمرین مرحله‌ای برای تمرکز بر لحظه حال",
  },
  grounding_activity: {
    title: "تمرین Grounding",
    duration: 5,
    description: "تمرین ۵-۴-۳-۲-۱ برای بازگشت به حال",
  },
  body_scan: {
    title: "Body Scan",
    duration: 12,
    description: "اسکن ذهنی بدن برای رهاسازی تنش‌ها",
  },

  // چت بات
  chatbot_support: {
    title: "گفتگو با روانشناس هوش مصنوعی",
    duration: 10,
    description: "صحبت با هوش مصنوعی برای تخلیه هیجانی",
  },
};
