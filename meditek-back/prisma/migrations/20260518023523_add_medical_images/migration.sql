-- CreateTable
CREATE TABLE "MedicalImage" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalImage_patientId_idx" ON "MedicalImage"("patientId");

-- AddForeignKey
ALTER TABLE "MedicalImage" ADD CONSTRAINT "MedicalImage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
