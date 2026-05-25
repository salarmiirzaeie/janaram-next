import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";

interface SubmitBody {
  answers: { questionId: number; score: number }[];
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const segments = req.nextUrl.pathname.split("/");
    const id = segments[segments.length - 2];
    const body: SubmitBody = await req.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, message: "answers الزامی و باید آرایه باشد" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const tests = db.collection("tests");
    const testResults = db.collection("test_results");

    // پیدا کردن تست
    const test = await tests.findOne({ test_id: id });
    if (!test) {
      return NextResponse.json(
        { success: false, message: "تست پیدا نشد" },
        { status: 404 }
      );
    }

    // محاسبه نمره کل
    let totalScore = 0;
    for (const ans of answers) {
      totalScore += ans.score;
    }

    // یافتن تفسیر مناسب بر اساس نمره
    let interpretation = null;
    for (const range of test.interpretation.ranges) {
      if (totalScore >= range.min_score && totalScore <= range.max_score) {
        interpretation = range;
        break;
      }
    }

    if (!interpretation) {
      // اگر بازه‌ای پیدا نشد (مثلاً نمره خارج از محدوده)
      return NextResponse.json(
        { success: false, message: "نمره خارج از محدوده تفسیر است" },
        { status: 500 }
      );
    }

    // ذخیره نتیجه در دیتابیس
    const resultDoc = {
      userId: new ObjectId(user.sub),
      testId: test.test_id,
      testName: test.test_name,
      answers: answers,
      totalScore: totalScore,
      resultTitle: interpretation.title,
      resultDescription: interpretation.description,
      meditationSuggestion: interpretation.meditation_suggestion || null,
      createdAt: new Date(),
    };

    const insertResult = await testResults.insertOne(resultDoc);

    return NextResponse.json({
      success: true,
      data: {
        totalScore: totalScore,
        resultTitle: interpretation.title,
        resultDescription: interpretation.description,
        meditationSuggestion: interpretation.meditation_suggestion,
        resultId: insertResult.insertedId.toString(),
      },
    });
  } catch (err) {
    console.error("Error submitting test:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
