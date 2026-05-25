import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const db = (await clientPromise).db("janaram-db");
    const reviews = db.collection("reviews");
    const users = db.collection("users");

    const [allReviews, total] = await Promise.all([
      reviews
        .find({ doctorId: id, status: "approved" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      reviews.countDocuments({ doctorId: id, status: "approved" }),
    ]);

    // گرفتن اطلاعات کاربران (نام و عکس)
    const userIds = allReviews.map((r) => new ObjectId(r.userId));
    const userDocs = await users
      .find({ _id: { $in: userIds } })
      .project({ name: 1, picture: 1 })
      .toArray();
    const userMap = new Map(userDocs.map((u) => [u._id.toString(), u]));

    const reviewsWithUser = allReviews.map((review) => ({
      id: review._id.toString(),
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: userMap.get(review.userId) || { name: "کاربر", picture: null },
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviewsWithUser,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error("Error fetching reviews:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
