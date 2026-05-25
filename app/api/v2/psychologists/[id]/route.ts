import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { APPROVED_DOCTOR_FILTER } from "@/lib/booking";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    const doc = await psychologists.findOne({
      _id: new ObjectId(id),
      ...APPROVED_DOCTOR_FILTER,
    });
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "روانشناس یافت نشد" },
        { status: 404 }
      );
    }

    const { _id, password, ...rest } = doc;

    return NextResponse.json({
      success: true,
      data: {
        id: _id.toString(),
        name: rest.name,
        specialty: rest.specialty,
        specialties: rest.specialties || [],
        bio: rest.bio || "",
        experience: rest.experience || 0,
        sessionPrice: rest.sessionPrice || 0,
        avatar: rest.avatar || null,
        categoryId: rest.categoryId || "individual",
        medicalLicenseNumber: rest.medicalLicenseNumber || "",
        successfulConsultations: rest.successfulConsultations || 0,
        schedule: rest.schedule || {},
        offDays: rest.offDays || [],
        rating: rest.rating || 4.5,
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error fetching psychologist:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
