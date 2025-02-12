import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const sales = await prisma.sale.findMany({
      where: {
        userId: session.user.id,
        ...(from && to
          ? {
              createdAt: {
                gte: new Date(from),
                lte: new Date(to),
              },
            }
          : {}),
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerName, items } = await request.json();
    const sale = await prisma.sale.create({
      data: {
        customerName,
        userId: session.user.id,
        total: items.reduce(
          (
            sum: number,
            item: { quantity: number; menuItem: { price: number } }
          ) => sum + item.quantity * item.menuItem.price,
          0
        ),
        items: {
          create: items.map(
            (item: { quantity: number; menuItem: { id: number } }) => ({
              quantity: item.quantity,
              menuItem: {
                connect: { id: item.menuItem.id },
              },
            })
          ),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Failed to create sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
