-- DropForeignKey
ALTER TABLE "MedicalImage" DROP CONSTRAINT "MedicalImage_patientId_fkey";

-- AddForeignKey
ALTER TABLE "MedicalImage" ADD CONSTRAINT "MedicalImage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
