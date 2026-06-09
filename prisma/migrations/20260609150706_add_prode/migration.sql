-- CreateTable
CREATE TABLE "prode_players" (
    "id" TEXT NOT NULL,
    "instagram" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "champion" TEXT,
    "runner_up" TEXT,
    "top_scorer" TEXT,
    "best_player" TEXT,
    "match_points" INTEGER NOT NULL DEFAULT 0,
    "extras_points" INTEGER NOT NULL DEFAULT 0,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prode_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_matches" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "home_team" TEXT NOT NULL,
    "away_team" TEXT NOT NULL,
    "match_date" TIMESTAMP(3),
    "home_score" INTEGER,
    "away_score" INTEGER,
    "finished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "prode_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_match_predictions" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "home_score" INTEGER NOT NULL,
    "away_score" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prode_match_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_settings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "champion" TEXT,
    "runner_up" TEXT,
    "top_scorer" TEXT,
    "best_player" TEXT,
    "predictions_locked" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prode_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prode_players_instagram_key" ON "prode_players"("instagram");

-- CreateIndex
CREATE UNIQUE INDEX "prode_players_email_key" ON "prode_players"("email");

-- CreateIndex
CREATE UNIQUE INDEX "prode_matches_code_key" ON "prode_matches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "prode_match_predictions_player_id_match_id_key" ON "prode_match_predictions"("player_id", "match_id");

-- AddForeignKey
ALTER TABLE "prode_match_predictions" ADD CONSTRAINT "prode_match_predictions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "prode_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_match_predictions" ADD CONSTRAINT "prode_match_predictions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "prode_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
