import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "";
const client = new MongoClient(MONGODB_URI);

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

    await client.connect();
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
