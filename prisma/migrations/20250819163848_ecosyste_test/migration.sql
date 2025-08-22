-- CreateTable
CREATE TABLE "search_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "user_id" UUID,
    "session_id" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" INET,
    "results_count" INTEGER NOT NULL,
    "took" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_clicks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "search_log_id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,
    "user_id" UUID,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_logs_user_id_created_at_idx" ON "search_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "search_logs_query_created_at_idx" ON "search_logs"("query", "created_at" DESC);

-- CreateIndex
CREATE INDEX "search_logs_session_id_created_at_idx" ON "search_logs"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "search_clicks_search_log_id_idx" ON "search_clicks"("search_log_id");

-- CreateIndex
CREATE INDEX "search_clicks_resource_id_created_at_idx" ON "search_clicks"("resource_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "search_clicks_user_id_created_at_idx" ON "search_clicks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "saved_searches_user_id_created_at_idx" ON "saved_searches"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "saved_searches_is_public_created_at_idx" ON "saved_searches"("is_public", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_clicks" ADD CONSTRAINT "search_clicks_search_log_id_fkey" FOREIGN KEY ("search_log_id") REFERENCES "search_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_clicks" ADD CONSTRAINT "search_clicks_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "api_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_clicks" ADD CONSTRAINT "search_clicks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
