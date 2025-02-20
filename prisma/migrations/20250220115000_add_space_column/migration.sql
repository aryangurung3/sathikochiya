/*
  Warnings:

  - Added the required column `space` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "space" TEXT NOT NULL;
