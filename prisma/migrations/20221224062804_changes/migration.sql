/*
  Warnings:

  - A unique constraint covering the columns `[publicKey]` on the table `Authority` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ataAddress` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "ataAddress" VARCHAR(44) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Authority_publicKey_key" ON "Authority"("publicKey");
