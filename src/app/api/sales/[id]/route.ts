import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { customerName, tableNumber, items } = await request.json();
    const id = (await params).id;
    const updatedSale = await prisma.sale.update({
      where: { id: id },
      data: {
        customerName,
        tableNumber,
        total: items.reduce(
          (
            sum: number,
            item: { quantity: number; menuItem: { price: number } }
          ) => sum + item.quantity * item.menuItem.price,
          0
        ),
        items: {
          deleteMany: {},
          create: items.map(
            (item: { quantity: number; menuItem: { id: string } }) => ({
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
    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error("Failed to update sale:", error);
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isPaid } = await request.json();
    const id = (await params).id;
    const updatedSale = await prisma.sale.update({
      where: { id: id },
      data: { isPaid },
    });
    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error("Failed to update sale status:", error);
    return NextResponse.json(
      { error: "Failed to update sale status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    if (!id) {
      return NextResponse.json(
        { error: "Sale ID is required" },
        { status: 400 }
      );
    }

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Delete all associated SaleItems first
    await prisma.saleItem.deleteMany({
      where: { saleId: id },
    });

    // Now delete the Sale
    await prisma.sale.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Failed to delete sale:", error);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
