import { cookies } from "next/headers";
import prisma from "./prisma";

export async function getServerSession() {
  const sessionToken = (await cookies()).get("session")?.value;

  if (!sessionToken) {
    return null;
  }

  // If you're storing sessions in the database, verify the session here
  // const session = await prisma.session.findUnique({ ... })

  // For now, we'll just verify the user exists
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return { user };
}
