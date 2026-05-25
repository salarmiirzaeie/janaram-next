import { createSlug } from "@/lib/createSlug";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string; // توی .env تعریفش کن
const client = new MongoClient(uri);

export async function migrateBlogs() {
  try {
    await client.connect();
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    const blogs = await collection.find({ slug: { $exists: false } }).toArray();

    console.log(`Found ${blogs.length} blogs without slug.`);

    for (const blog of blogs) {
      const slug = createSlug(blog.title);

      await collection.updateOne({ _id: new ObjectId(blog._id) }, { $set: { slug } });

      console.log(`✅ Added slug for blog: ${blog.title} → ${slug}`);
    }

    console.log("🎉 Migration completed.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.close();
  }
}
