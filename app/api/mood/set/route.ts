// pages/api/mood.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import moment from "moment-timezone";
import {
  getBreathingTypesForMood,
  getMeditationTypesForMood,
  moods,
  trains,
} from "@/lib/mood";
import { sendNotification } from "@/lib/notifications";
import { generateMoodNotification } from "@/lib/aiNotification";

interface IMood {
  mood: number | null;
  note?: string;
}

// Helper for today's date
const getTodayGregorianDate = (): string =>
  moment.tz("Asia/Tehran").format("YYYY-MM-DD");

// Create exercises for user dynamically
const createUserExercisesForMood = async (
  userId: ObjectId,
  moodKey: string,
  db: any
) => {
  const exercisesCollection = db.collection("user-exercises");
  const meditationCollection = db.collection("meditations");
  const breathingCollection = db.collection("breathing");

  const exercises = trains[moodKey as keyof typeof trains] || [];
  const excludedMeditationId = new ObjectId("690df6fbe98f4f19c3e30398");

  for (const exercise of exercises) {
    // Meditation
    if (exercise.includes("meditation")) {
      const meditationTypes = getMeditationTypesForMood(moodKey);
      const meditation = await meditationCollection
        .aggregate([
          {
            $match: {
              type: { $in: meditationTypes },
              _id: { $ne: excludedMeditationId }, // ← فیلتر درست در همین‌جا
            },
          },
          { $sample: { size: 1 } },
        ])
        .toArray();

      if (meditation.length > 0) {
        await exercisesCollection.insertOne({
          userId,
          date: getTodayGregorianDate(),
          exerciseId: meditation[0]._id.toString(),
          type: "meditation",
          done: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPro: meditation[0].accessLevel === "unlimited",
        });
      }
    }
    // Breathing
    else if (exercise.includes("breathing")) {
      const breathingTypes = getBreathingTypesForMood(moodKey);
      const breathing = await breathingCollection
        .aggregate([
          { $match: { type: { $in: breathingTypes } } },
          { $sample: { size: 1 } },
        ])
        .toArray();

      if (breathing.length > 0) {
        await exercisesCollection.insertOne({
          userId,
          date: getTodayGregorianDate(),
          exerciseId: breathing[0]._id.toString(),
          type: "breathing",
          done: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPro: breathing[0].isPremium,
        });
      }
    }
    // Step activities (mindful_activity, grounding_activity, body_scan)
    else if (
      ["mindful_activity", "grounding_activity", "body_scan"].includes(exercise)
    ) {
      await exercisesCollection.insertOne({
        userId,
        date: getTodayGregorianDate(),
        exerciseId: exercise,
        type: "step-activity",
        done: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    // Text activities (journaling, gratitude_exercise, daily_tip)
    else if (
      ["journaling", "gratitude_exercise", "daily_tip"].includes(exercise)
    ) {
      await exercisesCollection.insertOne({
        userId,
        date: getTodayGregorianDate(),
        exerciseId: exercise,
        type: "text-activity",
        done: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    // Chatbot
    else if (exercise.includes("chatbot")) {
      await exercisesCollection.insertOne({
        userId,
        date: getTodayGregorianDate(),
        exerciseId: exercise,
        type: "chatbot",
        done: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      console.warn("Unknown exercise type:", exercise);
    }
  }
};

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const body: IMood = await req.json();
    const { mood, note } = body;

    if (mood !== null && (typeof mood !== "number" || mood < 0 || mood > 10)) {
      return NextResponse.json(
        { success: false, message: "مقدار mood باید بین 0 تا 10 یا null باشد" },
        { status: 400 }
      );
    }

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch {
      return NextResponse.json(
        { success: false, message: "شناسه کاربر نامعتبر است" },
        { status: 400 }
      );
    }

    const sanitizedNote = note;
    const db = (await clientPromise).db("janaram-db");
    const moodHistory = db.collection("mood-history");
    const userDoc = await db.collection("users").findOne({ _id: userId });
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const today = getTodayGregorianDate();
    const existingMood = await moodHistory.findOne({ userId, date: today });

    let isTodayFirstMood = false;

    if (existingMood) {
      await moodHistory.updateOne(
        { userId, date: today },
        { $set: { mood, note: sanitizedNote, updatedAt: new Date() } }
      );
    } else {
      await moodHistory.insertOne({
        userId,
        date: today,
        mood,
        note: sanitizedNote,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      isTodayFirstMood = true;
      if (mood !== null && mood < 5) {
        const userName = userDoc.name || "دوست عزیزم";
        const moodObj = moods.find((m) => m.value === mood);
        const moodLabel = moodObj?.label || "خسته";

        setTimeout(() => {
          sendNotification({
            userId,
            title: "جانارام همیشه همراهته",
            body: `${userName} جان، متاسفم که امروز ${moodLabel} هستی 💙 یادت باشه من همیشه پیشتم`,
            action: "mood",
          });
        }, 1 * 60 * 1000); // 1 دقیقه بعد
      }

      const moodObj = moods.find((m) => m.value === mood);
      if (moodObj) {
        await createUserExercisesForMood(userId, moodObj.key, db);
      }
    }

    return NextResponse.json({
      success: true,
      message: existingMood ? "حالت امروز به‌روزرسانی شد" : "حالت امروز ثبت شد",
      data: { date: today, mood, note: sanitizedNote, isTodayFirstMood },
    });
  } catch (err: any) {
    console.error("Error processing mood:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const today = getTodayGregorianDate();
    const userId = new ObjectId(user.sub);
    const moodHistory = db.collection("mood-history");
    const exercisesCollection = db.collection("user-exercises");

    const moodEntry = await moodHistory.findOne({ userId, date: today });
    const totalMoodDays = await moodHistory.countDocuments({ userId });

    if (!moodEntry) {
      return NextResponse.json({
        success: true,
        data: {
          date: today,
          moodRegistered: false,
          exercisesRegistered: false,
          status: "no-mood",
          totalMoodDays,
        },
      });
    }

    const exercises = await exercisesCollection
      .find({ userId, date: today })
      .toArray();
    const totalExercises = exercises.length;
    const completedExercises = exercises.filter((e) => e.done).length;
    const progressPercent = totalExercises
      ? Math.round((completedExercises / totalExercises) * 100)
      : 0;

    let status: "no-mood" | "not-started" | "in-progress" | "completed" =
      "not-started";
    if (progressPercent === 100 && totalExercises > 0) status = "completed";
    else if (progressPercent > 0) status = "in-progress";

    return NextResponse.json({
      success: true,
      data: {
        date: today,
        moodRegistered: true,
        exercisesRegistered: totalExercises > 0,
        totalExercises,
        completedExercises,
        progressPercent,
        status,
        totalMoodDays,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
