-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "documentType" TEXT,
    "imageUrl" TEXT,
    "imageBase64" TEXT,
    "thumbnailUrl" TEXT,
    "hylandDocId" TEXT,
    "extractedData" TEXT,
    "confidence" REAL,
    "uploadedAt" DATETIME,
    "processingStartedAt" DATETIME,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0
);
