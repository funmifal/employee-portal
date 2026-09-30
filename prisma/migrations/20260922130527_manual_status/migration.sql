-- CreateExtension safely (skip if pgvector is not installed; init migration provides a fallback type)
DO $$ 
BEGIN 
  CREATE EXTENSION IF NOT EXISTS vector; 
EXCEPTION WHEN OTHERS THEN 
  RAISE NOTICE 'pgvector extension unavailable - using fallback type'; 
END $$;

-- CreateEnum
CREATE TYPE "ManualStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Manual" ADD COLUMN     "status" "ManualStatus" NOT NULL DEFAULT 'DRAFT';