import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";

export const PUT = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const requestId = pathSegments[pathSegments.length - 1];

    if (!requestId || requestId === "withdraw-requests") {
      return NextResponse.json(
        { success: false, message: "شناسه درخواست نامعتبر است" },
        { status: 400 }
      );
    }

    const { status, rejectionReason } = await req.json();

    if (!status || !["approved", "rejected", "paid"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejectionReason) {
      return NextResponse.json(
        { success: false, message: "لطفاً دلیل رد شدن را وارد کنید" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const withdrawRequests = db.collection("withdraw_requests");
    const transactions = db.collection("transactions");

    const request = await withdrawRequests.findOne({
      _id: new ObjectId(requestId),
    });
    if (!request) {
      return NextResponse.json(
        { success: false, message: "درخواست یافت نشد" },
        { status: 404 }
      );
    }

    if (request.status !== "pending" && status !== "paid") {
      return NextResponse.json(
        { success: false, message: "این درخواست قبلاً پردازش شده است" },
        { status: 400 }
      );
    }

    const updateFields: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    if (status === "rejected") {
      updateFields.rejectionReason = rejectionReason;
    }

    await withdrawRequests.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateFields }
    );

    const transactionStatus =
      status === "rejected" ? "failed" : "success";

    await transactions.updateOne(
      { withdrawRequestId: new ObjectId(requestId) },
      {
        $set: {
          status: transactionStatus,
          updatedAt: new Date(),
        },
      }
    );

    const messages: Record<string, string> = {
      approved: "درخواست تسویه تأیید شد",
      paid: "تسویه حساب انجام شد",
      rejected: "درخواست تسویه رد شد",
    };

    return NextResponse.json({
      success: true,
      message: messages[status],
    });
  } catch (err: any) {
    console.error("Error updating withdraw request:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
