-- AlterTable
ALTER TABLE "user" ALTER COLUMN "secret2FA" DROP NOT NULL,
ALTER COLUMN "secret2FA" DROP DEFAULT,
ALTER COLUMN "secret2FA" SET DATA TYPE TEXT;
