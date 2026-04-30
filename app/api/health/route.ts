import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return NextResponse.json({ ok: dbOk, db: dbOk });
}
