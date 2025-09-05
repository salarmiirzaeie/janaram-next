import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
interface CompleteExerciseBody {
  exerciseId: string; // _id از collection user-exercises
}

interface CompleteExerciseResponse {
  success: boolean;
  message: string;
  data?: {
    exerciseId: string;
    done: boolean;
  };
}
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();
    const { exerciseId } = body;

    if (!exerciseId) {
      return NextResponse.json({ success: false, message: "exerciseId الزامی است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const userExercises = db.collection("user-exercises");

    const result = await userExercises.updateOne(
      { _id: new ObjectId(exerciseId), userId: new ObjectId(user.sub) },
      { $set: { done: true, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "تمرین پیدا نشد یا قبلا انجام شده" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "تمرین علامت زده شد به عنوان انجام شده",
      data: {
        exerciseId,
        done: true,
      },
    });
  } catch (err) {
    console.error("Error completing exercise:", err);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
