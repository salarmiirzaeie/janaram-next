import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

// GET : دریافت اطلاعات حساب بانکی
export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const bankAccounts = db.collection("doctor_bank_accounts");

    const account = await bankAccounts.findOne({ doctorId: doctor.sub });

    if (!account) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "اطلاعات بانکی یافت نشد",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: account._id.toString(),
        accountName: account.accountName,
        cardNumber: account.cardNumber,
        sheba: account.sheba,
        updatedAt: account.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error fetching bank account:", err);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});

// PUT : بروزرسانی اطلاعات حساب بانکی
export const PUT = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const body = await req.json();
    const { accountName, cardNumber, sheba } = body;
    // اعتبارسنجی
    if (!accountName || !cardNumber || !sheba) {
      return NextResponse.json({ success: false, message: "تمامی فیلدها الزامی هستند" }, { status: 400 });
    }

    // اعتبارسنجی ساده شماره شبا (IR + 24 رقم)
    const shebaRegex = /^IR[0-9]{24}$/;
    if (!shebaRegex.test(sheba)) {
      return NextResponse.json({ success: false, message: "شماره شبا نامعتبر است" }, { status: 400 });
    }

    // اعتبارسنجی شماره کارت (16 رقم)
    const cardRegex = /^[0-9]{16}$/;
    const cleanCardNumber = cardNumber.replace(/-/g, "");
    if (!cardRegex.test(cleanCardNumber)) {
      return NextResponse.json({ success: false, message: "شماره کارت نامعتبر است" }, { status: 400 });
    }

    // فرمت کردن شماره کارت با ستاره
    const maskedCardNumber = `${cleanCardNumber.slice(0, 4)}‑****‑****‑${cleanCardNumber.slice(-4)}`;

    const db = (await clientPromise).db("janaram-db");
    const bankAccounts = db.collection("doctor_bank_accounts");

    const result = await bankAccounts.updateOne(
      { doctorId: doctor.sub },
      {
        $set: {
          accountName,
          cardNumber: maskedCardNumber,
          cardNumberRaw: cleanCardNumber, // ذخیره خام برای استفاده بعدی
          sheba,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          doctorId: doctor.sub,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({
      success: true,
      message: "اطلاعات بانکی با موفقیت ذخیره شد",
    });
  } catch (err: any) {
    console.error("Error updating bank account:", err);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
