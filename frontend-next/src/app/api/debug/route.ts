import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasClerkKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
    hasPostgres: !!process.env.POSTGRES_URL,
    hasReplicate: !!process.env.REPLICATE_API_TOKEN,
    envKeys: Object.keys(process.env).filter(k => !k.includes("SECRET") && !k.includes("KEY") && !k.includes("TOKEN") && !k.includes("URL"))
  });
}
