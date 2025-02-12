import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, price } = await request.json();
    const menuItem = await prisma.menuItem.create({
      data: { title, price: Number.parseFloat(price) },
    });
    return NextResponse.json(menuItem);
  } catch (error) {
    console.error("Failed to create menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    // Start a transaction to ensure all operations are completed or none are
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Find all SaleItems associated with this MenuItem
      const saleItems = await prisma.saleItem.findMany({
        where: { menuItemId: id },
        include: { sale: true },
      });

      // 2. Delete all SaleItems associated with this MenuItem
      await prisma.saleItem.deleteMany({
        where: { menuItemId: id },
      });

      // 3. Delete the MenuItem itself
      const deletedMenuItem = await prisma.menuItem.delete({
        where: { id },
      });

      // 4. Delete any Sales that no longer have any SaleItems
      const salesToDelete = saleItems.map((item) => item.sale.id);
      await prisma.sale.deleteMany({
        where: {
          id: { in: salesToDelete },
          items: { none: {} },
        },
      });

      return deletedMenuItem;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to delete menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
