import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { sql } from "@vercel/postgres";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

export async function POST(req: NextRequest) {
  await ensureTable();
  const stripe = getStripe();
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (userId) {
      const creditsToAdd = plan === "annual" ? 600 : 50;
      const isPro = true;

      try {
        await sql`
          INSERT INTO user_credits (user_id, credits_remaining, is_pro, updated_at)
          VALUES (${userId}, ${creditsToAdd}, ${isPro}, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            credits_remaining = user_credits.credits_remaining + ${creditsToAdd},
            is_pro = TRUE,
            updated_at = NOW();
        `;
        console.log(`User ${userId} bought ${plan} plan. Added ${creditsToAdd} credits.`);
      } catch (err) {
        console.error("Database error in webhook:", err);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
