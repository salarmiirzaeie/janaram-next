import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

// Configure multer to save files to public/profilephotos
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const dir = path.join(process.cwd(), "public/profilephotos");
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const user = (req as any).user;
      const userId = user?.sub || "unknown";
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${userId}-${Date.now()}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      return cb(new Error("فقط فرمت‌های JPEG و PNG مجاز هستند"));
    }
    if (file.size > 5 * 1024 * 1024) {
      return cb(new Error("فایل عکس باید کمتر از ۵ مگابایت باشد"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Phone number validation
const validatePhoneNumber = (phone: string): boolean => {
  return /^(\+98|0)?9\d{9}$/.test(phone);
};

// Middleware to handle multer and FormData parsing
const runMulter = async (req: NextRequest) => {
  const formData = await req.formData();
  const fields: { [key: string]: string } = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      fields[key] = value;
    }
  }

  return new Promise<{ fields: { [key: string]: string }; files: any }>((resolve, reject) => {
    upload.single("profilePhoto")(req as any, {} as any, (err) => {
      if (err) return reject(err);
      resolve({
        fields,
        files: (req as any).file,
      });
    });
  });
};

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Validate user.sub
    if (!user?.sub) {
      console.error("No user.sub provided by withAuth middleware");
      return NextResponse.json({ success: false, message: "شناسه کاربر ارائه نشده است" }, { status: 401 });
    }

    // Parse form data
    const { fields, files } = await runMulter(req);
    console.log("Parsed fields:", fields);
    console.log("Parsed files:", files);

    const name = fields.name;
    const phoneNumber = fields.phoneNumber;
    const profilePhotoFile = files;

    // Validate inputs
    if (!name || !phoneNumber) {
      console.error("Missing name or phoneNumber:", { name, phoneNumber });
      return NextResponse.json({ success: false, message: "نام و شماره تلفن الزامی هستند" }, { status: 400 });
    }
    if (typeof name !== "string") {
      console.error("Invalid name type:", typeof name);
      return NextResponse.json({ success: false, message: "نام باید یک رشته باشد" }, { status: 400 });
    }
    if (!validatePhoneNumber(phoneNumber)) {
      console.error("Invalid phoneNumber:", phoneNumber);
      return NextResponse.json({ success: false, message: "شماره تلفن نامعتبر است" }, { status: 400 });
    }

    // Convert user.sub to ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    // Connect to the database
    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");

    // Check if user exists
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    // Prepare update object
    const updateFields: Partial<User> = {
      name,
      phoneNumber,
      updatedAt: new Date(),
    };

    // Handle profile photo
    let profilePhotoUrl: string | undefined;
    if (profilePhotoFile) {
      profilePhotoUrl = `/profilephotos/${profilePhotoFile.filename}`;
      updateFields.picture = profilePhotoUrl;

      // Delete old profile photo
      if (userDoc.picture) {
        const oldFilePath = path.join(process.cwd(), "public", userDoc.picture);
        await fs.unlink(oldFilePath).catch(() => {});
      }
    }

    // Update user in the database
    const updateResult = await users.updateOne({ _id: userId }, { $set: updateFields });

    if (updateResult.matchedCount === 0) {
      console.error("Failed to update user, no match found for _id:", userId.toString());
      return NextResponse.json({ success: false, message: "به‌روزرسانی ناموفق بود" }, { status: 500 });
    }

    // Fetch updated user data
    const updatedUser = await users.findOne(
      { _id: userId },
      { projection: { name: 1, phoneNumber: 1, picture: 1, _id: 0 } }
    );

    if (!updatedUser) {
      console.error("Failed to fetch updated user for _id:", userId.toString());
      return NextResponse.json({ success: false, message: "خطا در بازیابی اطلاعات به‌روزرسانی‌شده" }, { status: 500 });
    }

    // Prepare response
    const response: { name: string; phoneNumber: string; profilePhoto?: string | null } = {
      name: updatedUser.name!,
      phoneNumber: updatedUser.phoneNumber !== null ? updatedUser.phoneNumber : "",
    };
    if (updatedUser.picture) {
      response.profilePhoto = updatedUser.picture;
    }

    return NextResponse.json({ success: true, data: response, message: "Profile updated successfully" });
  } catch (err: any) {
    console.error("Error in updating user profile:", err.message);
    return NextResponse.json({ success: false, message: err.message || "خطای سرور" }, { status: 500 });
  }
});
