import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "sanjivani_sugar";

if (!uri) {
  console.error("❌ MONGODB_URI is not defined in .env");
  process.exit(1);
}

const farmersData = [
  { name: "Ramesh Shinde", village: "Kopargaon", sugarcane_tons: 120.5, payment_pending: 45000, amount_paid: 85000 },
  { name: "Suresh Patil", village: "Yeola", sugarcane_tons: 95.0, payment_pending: 30000, amount_paid: 65000 },
  { name: "Vijay Jadhav", village: "Rahata", sugarcane_tons: 150.75, payment_pending: 60000, amount_paid: 110000 },
  { name: "Ganesh More", village: "Shirdi", sugarcane_tons: 80.25, payment_pending: 20000, amount_paid: 55000 },
  { name: "Ashok Pawar", village: "Niphad", sugarcane_tons: 110.0, payment_pending: 35000, amount_paid: 75000 },
  { name: "Dilip Wagh", village: "Kopargaon", sugarcane_tons: 75.5, payment_pending: 15000, amount_paid: 45000 },
  { name: "Santosh Gaikwad", village: "Rahata", sugarcane_tons: 135.0, payment_pending: 50000, amount_paid: 90000 },
  { name: "Prakash Kadam", village: "Yeola", sugarcane_tons: 90.0, payment_pending: 25000, amount_paid: 60000 },
  { name: "Mahesh Chavan", village: "Shirdi", sugarcane_tons: 160.25, payment_pending: 70000, amount_paid: 120000 },
  { name: "Sunil Borse", village: "Niphad", sugarcane_tons: 105.5, payment_pending: 28000, amount_paid: 72000 }
];

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri!);

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas!");

    const db = client.db(dbName);
    const collection = db.collection("farmers");

    // Clear existing to avoid duplicates on re-run
    await collection.deleteMany({});
    console.log("Cleared existing collection.");

    const result = await collection.insertMany(farmersData);
    console.log(`Inserted ${result.insertedCount} sugarcane farmers into '${dbName}.farmers'.`);

    const count = await collection.countDocuments();
    console.log(`Total farmers in database: ${count}`);
  } catch (error) {
    console.error("Error during MongoDB seeding:", error);
  } finally {
    await client.close();
  }
}

seed();
