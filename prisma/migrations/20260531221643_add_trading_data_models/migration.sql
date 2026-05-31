-- CreateTable
CREATE TABLE "insider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "tradeCount" INTEGER NOT NULL,
    "lastTradeDate" TIMESTAMP(3) NOT NULL,
    "estimatedEdge" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade" (
    "id" TEXT NOT NULL,
    "insiderId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "disclosureDate" TIMESTAMP(3) NOT NULL,
    "ticker" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notional" DOUBLE PRECISION NOT NULL,
    "disclosureLag" INTEGER NOT NULL,
    "priceAtTrade" DOUBLE PRECISION NOT NULL,
    "priceNow" DOUBLE PRECISION NOT NULL,
    "returnPct" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_event" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "market_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insider_news" (
    "id" TEXT NOT NULL,
    "insiderId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "headline" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "insider_news_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trade_insiderId_idx" ON "trade"("insiderId");

-- CreateIndex
CREATE INDEX "insider_news_insiderId_idx" ON "insider_news"("insiderId");

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_insiderId_fkey" FOREIGN KEY ("insiderId") REFERENCES "insider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insider_news" ADD CONSTRAINT "insider_news_insiderId_fkey" FOREIGN KEY ("insiderId") REFERENCES "insider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
