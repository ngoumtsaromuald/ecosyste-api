/*
  Warnings:

  - A unique constraint covering the columns `[resource_id,day_of_week]` on the table `business_hours` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "resourceId_dayOfWeek" ON "business_hours"("resource_id", "day_of_week");
