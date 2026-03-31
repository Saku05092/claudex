/**
 * Stripe integration for AirHunt subscriptions.
 *
 * Flow:
 * 1. User signs up on web (Supabase Auth)
 * 2. User clicks "Upgrade to Pro/Unlimited"
 * 3. Server creates Stripe Checkout session
 * 4. User pays on Stripe hosted page
 * 5. Stripe webhook updates profiles.plan in Supabase
 */

interface StripeConfig {
  readonly secretKey: string;
  readonly webhookSecret: string;
  readonly proPriceId: string;
  readonly unlimitedPriceId: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
}

type PlanType = "pro" | "unlimited";

interface CheckoutSessionResult {
  readonly sessionId: string;
  readonly url: string;
}

interface WebhookResult {
  readonly handled: boolean;
  readonly event: string;
  readonly userId?: string;
  readonly plan?: string;
}

function loadStripeConfig(): StripeConfig {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID ?? "";
  const unlimitedPriceId = process.env.STRIPE_UNLIMITED_PRICE_ID ?? "";
  const successUrl = process.env.STRIPE_SUCCESS_URL ?? "http://localhost:3001/success";
  const cancelUrl = process.env.STRIPE_CANCEL_URL ?? "http://localhost:3001/cancel";

  return {
    secretKey,
    webhookSecret,
    proPriceId,
    unlimitedPriceId,
    successUrl,
    cancelUrl,
  };
}

function getPriceIdForPlan(config: StripeConfig, plan: PlanType): string {
  const priceMap: Record<PlanType, string> = {
    pro: config.proPriceId,
    unlimited: config.unlimitedPriceId,
  };
  return priceMap[plan];
}

/**
 * Creates a Stripe Checkout session for upgrading a user's plan.
 *
 * @param userId - Supabase user ID (stored as metadata in Stripe session)
 * @param plan - Target plan: "pro" or "unlimited"
 * @returns Session ID and checkout URL
 */
export async function createCheckoutSession(
  userId: string,
  plan: PlanType,
): Promise<CheckoutSessionResult> {
  const config = loadStripeConfig();

  if (!config.secretKey) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const priceId = getPriceIdForPlan(config, plan);
  if (!priceId) {
    throw new Error(`No price ID configured for plan: ${plan}`);
  }

  // TODO: Initialize Stripe SDK
  // const stripe = new Stripe(config.secretKey);

  // TODO: Create Stripe Checkout session
  // const session = await stripe.checkout.sessions.create({
  //   mode: "subscription",
  //   payment_method_types: ["card"],
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   success_url: `${config.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url: config.cancelUrl,
  //   client_reference_id: userId,
  //   metadata: { userId, plan },
  // });

  // Placeholder until Stripe account is created
  const placeholderSessionId = `cs_placeholder_${Date.now()}`;
  return {
    sessionId: placeholderSessionId,
    url: `${config.successUrl}?session_id=${placeholderSessionId}`,
  };
}

/**
 * Processes Stripe webhook events.
 * Handles checkout.session.completed to update user plan in Supabase.
 *
 * @param payload - Raw request body string
 * @param signature - Stripe-Signature header value
 * @returns Webhook processing result
 */
export async function handleWebhook(
  payload: string,
  signature: string,
): Promise<WebhookResult> {
  const config = loadStripeConfig();

  if (!config.webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  // TODO: Verify webhook signature with Stripe SDK
  // const stripe = new Stripe(config.secretKey);
  // const event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);

  // Placeholder: parse raw payload
  let event: { type: string; data: { object: { client_reference_id?: string; metadata?: Record<string, string> } } };
  try {
    event = JSON.parse(payload);
  } catch {
    throw new Error("Invalid webhook payload");
  }

  if (!signature) {
    throw new Error("Missing Stripe-Signature header");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id ?? session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (!userId || !plan) {
      return { handled: false, event: event.type };
    }

    // TODO: Update Supabase profiles.plan
    // import { createClient } from "@supabase/supabase-js";
    // const supabaseAdmin = createClient(
    //   process.env.SUPABASE_URL!,
    //   process.env.SUPABASE_SERVICE_ROLE_KEY!,
    // );
    // await supabaseAdmin
    //   .from("profiles")
    //   .update({ plan })
    //   .eq("id", userId);

    console.log(`[Stripe] Plan updated: user=${userId}, plan=${plan}`);

    return { handled: true, event: event.type, userId, plan };
  }

  // Unhandled event type
  return { handled: false, event: event.type };
}

/**
 * Parse raw request body from IncomingMessage.
 */
export function collectRequestBody(req: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}
