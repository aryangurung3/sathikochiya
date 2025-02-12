import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const sessionToken = (await cookies()).get("session")?.value;

    if (sessionToken) {
      await prisma.session.delete({
        where: { token: sessionToken },
      });
    }
s
    (await cookies()).delete("session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
