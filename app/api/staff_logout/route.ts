import { NextResponse } from "next/server";
import { STAFF_COOKIE_NAME } from "@/lib/staffAuth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(STAFF_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
