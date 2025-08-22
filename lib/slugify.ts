import clientPromise from "./mongodb";

export const generateUniqueSlug = async (
  title: string,
  dbName: string = "janaram-db",
  collectionName: string = "blogs"
): Promise<string> => {
  // Convert title to a URL-friendly slug
  let slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single

  // Connect to MongoDB
  const client = await clientPromise;
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  // Check for existing slugs
  let uniqueSlug = slug;
  let counter = 1;
  while (await collection.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};
