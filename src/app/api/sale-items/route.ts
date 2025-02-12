import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          },
        },
      },
      include: {
        menuItem: true,
        sale: {
          select: {
            createdAt: true,
          },
        },
      },
    });
    return NextResponse.json(saleItems);
  } catch (error) {
    console.error("Failed to fetch sale items:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale items" },
      { status: 500 }
    );
  }
}
