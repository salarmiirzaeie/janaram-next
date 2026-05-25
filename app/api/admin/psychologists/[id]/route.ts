import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";

// GET : دریافت جزئیات یک روانشناس
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];

    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه روانشناس نامعتبر است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    const doctor = await psychologists.findOne({ _id: new ObjectId(id) });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "روانشناس یافت نشد" },
        { status: 404 }
      );
    }

    const { _id, password, ...rest } = doctor;

    return NextResponse.json({
      success: true,
      data: {
        id: _id.toString(),
        ...rest,
      },
    });
  } catch (err: any) {
    console.error("Error fetching doctor details:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});

// PUT : تأیید یا رد کردن روانشناس
export const PUT = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];

    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه روانشناس نامعتبر است" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!status || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json(
        {
          success: false,
          message: "وضعیت نامعتبر است. فقط approved یا rejected مجاز است.",
        },
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
    const psychologists = db.collection("psychologists");

    const doctor = await psychologists.findOne({ _id: new ObjectId(id) });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "روانشناس یافت نشد" },
        { status: 404 }
      );
    }

    const updateFields: any = {
      status,
      updatedAt: new Date(),
      verifiedAt: new Date(),
    };

    if (status === "approved") {
      updateFields.rejectionReason = null;
    } else if (status === "rejected") {
      updateFields.rejectionReason = rejectionReason;
    }

    await psychologists.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "روانشناس با موفقیت تأیید شد"
          : "روانشناس رد شد",
    });
  } catch (err: any) {
    console.error("Error verifying/rejecting doctor:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
