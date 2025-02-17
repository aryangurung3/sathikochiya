/*
  Warnings:

  - Added the required column `tableNumber` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tableNumber" TEXT NOT NULL,
ALTER COLUMN "customerName" DROP NOT NULL;
