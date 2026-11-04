-- Metode bayar online (payment gateway)
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'GATEWAY';

-- Berat barang untuk ongkir dinamis
ALTER TABLE "products" ADD COLUMN "weightGrams" INTEGER NOT NULL DEFAULT 500;

-- Berat paket dan data invoice gateway pada pesanan
ALTER TABLE "orders"
  ADD COLUMN "totalWeight" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "gatewayInvoiceId" TEXT,
  ADD COLUMN "gatewayUrl" TEXT,
  ADD COLUMN "paymentChannel" TEXT;

CREATE UNIQUE INDEX "orders_gatewayInvoiceId_key" ON "orders"("gatewayInvoiceId");
