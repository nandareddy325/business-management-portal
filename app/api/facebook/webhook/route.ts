import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN =
  process.env.FACEBOOK_VERIFY_TOKEN || "GK_HOME_INTERIORS_VERIFY_TOKEN_2026";

/**
 * GET
 * Facebook Webhook Verification
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Facebook Webhook Verified");

    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(
    { error: "Verification Failed" },
    { status: 403 }
  );
}

/**
 * POST
 * Receive Facebook Lead Events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📩 Facebook Webhook Received");
    console.log(JSON.stringify(body, null, 2));

    if (body.object === "page") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "leadgen") {
            const lead = change.value;

            console.log("✅ New Facebook Lead");

            console.log({
              page_id: lead.page_id,
              form_id: lead.form_id,
              leadgen_id: lead.leadgen_id,
              created_time: lead.created_time,
            });

            /**
             * TODO:
             * Fetch Lead Details using Graph API
             * Save to Supabase
             * Send Notification
             */
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Webhook Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Webhook Error",
      },
      {
        status: 500,
      }
    );
  }
}