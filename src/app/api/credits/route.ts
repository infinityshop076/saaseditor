import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@vercel/postgres";

// Ensure the credits table exists
async function ensureTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_credits (
        user_id TEXT PRIMARY KEY,
        credits_remaining INTEGER NOT NULL DEFAULT 5,
        is_pro BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
  } catch (_) {}
}

// GET /api/credits — fetch credits for current user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTable();

  // Upsert and get current state in one go
  const result = await sql`
    INSERT INTO user_credits (user_id, credits_remaining, is_pro)
    VALUES (${userId}, 5, FALSE)
    ON CONFLICT (user_id) 
    DO UPDATE SET updated_at = NOW()
    RETURNING credits_remaining, is_pro;
  `;

  const row = result.rows[0];
  const credits = row.is_pro ? 999999 : row.credits_remaining;
  return NextResponse.json({ credits, isPro: row.is_pro });
}

// POST /api/credits — consume 1 credit
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTable();

  const check = await sql`
    SELECT credits_remaining, is_pro FROM user_credits WHERE user_id = ${userId};
  `;

  const row = check.rows[0];
  if (!row) return NextResponse.json({ error: "No record found" }, { status: 404 });
  if (!row.is_pro && row.credits_remaining <= 0) {
    return NextResponse.json({ error: "No credits remaining" }, { status: 402 });
  }

  if (!row.is_pro) {
    await sql`
      UPDATE user_credits 
      SET credits_remaining = credits_remaining - 1, updated_at = NOW()
      WHERE user_id = ${userId};
    `;
  }

  const remaining = row.is_pro ? Infinity : row.credits_remaining - 1;
  return NextResponse.json({ credits: remaining, isPro: row.is_pro });
}
