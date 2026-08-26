import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "";

type GlobalMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

async function getClient(): Promise<MongoClient> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  const globalForMongo = globalThis as GlobalMongo;
  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = new MongoClient(MONGODB_URI).connect();
  }
  return globalForMongo._mongoClientPromise;
}

const websites = [
  "cpmccVisitors",
  "toylockerVisitors",
  "snhipVisitors",
  "loamdepotVisitors",
];

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dbName = searchParams.get("db");

    if (!dbName || !websites.includes(dbName)) {
      return NextResponse.json(
        { message: "Invalid database name" },
        { status: 400 }
      );
    }

    const client = await getClient();
    const db = client.db(dbName);
    const visitors = await db.collection("mainPage").find({}).toArray();

    return NextResponse.json(visitors);
  } catch (error) {
    console.error("Error fetching visitor data:", error);
    return NextResponse.json(
      { message: "Failed to retrieve visitor data" },
      { status: 500 }
    );
  }
}
