import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sessionToken = (await cookies()).get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      // Session expired or not found
      (await cookies()).delete("session");
      return NextResponse.json({ user: null });
    }

    const { user } = session;
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Session check failed:", error);
    return NextResponse.json(
      { error: "Session check failed" },
      { status: 500 }
    );
  }
}
