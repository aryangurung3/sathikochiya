import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, currentPassword, newPassword } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid current password" },
        { status: 400 }
      );
    }

    // Update user details
    const updateData: { email?: string; password?: string } = {};
    if (email !== user.email) {
      updateData.email = email;
    }
    if (newPassword) {
      updateData.password = await hash(newPassword, 10);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    return NextResponse.json({ message: "User details updated successfully" });
  } catch (error) {
    console.error("Error updating user details:", error);
    return NextResponse.json(
      { error: "Failed to update user details" },
      { status: 500 }
    );
  }
}
