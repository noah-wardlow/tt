import { Hono } from "hono";
import { getStripeClient } from "../lib/stripe";

type Bindings = {
  STRIPE_SECRET_KEY: string;
  STRIPE_CONNECT_WEBHOOK_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/connect-webhook", async (c) => {
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.text("Missing stripe-signature header", 400);
  }

  if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
    console.error("Missing Stripe Connect configuration");
    return c.text("Connect webhook handler not configured", 500);
  }

  try {
    const stripe = getStripeClient(c.env.STRIPE_SECRET_KEY);
    const body = await c.req.text();

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      c.env.STRIPE_CONNECT_WEBHOOK_SECRET
    );

    console.log(`Received Connect webhook event: ${event.type}`);

    // Handle different Connect event types
    switch (event.type) {
      case "account.updated":
        console.log("Connect account updated:", event.data.object.id);
        // Handle account updates (e.g., verification status changes)
        break;

      case "account.application.authorized":
        console.log("Account authorized application:", event.data.object.id);
        break;

      case "account.application.deauthorized":
        console.log("Account deauthorized application:", event.data.object.id);
        break;

      case "account.external_account.created":
        console.log("External account created:", event.data.object.id);
        break;

      case "account.external_account.updated":
        console.log("External account updated:", event.data.object.id);
        break;

      case "account.external_account.deleted":
        console.log("External account deleted:", event.data.object.id);
        break;

      case "capability.updated":
        console.log("Capability updated:", event.data.object);
        // Handle capability status changes (e.g., card_payments, transfers)
        break;

      case "person.created":
        console.log("Person created:", event.data.object.id);
        break;

      case "person.updated":
        console.log("Person updated:", event.data.object.id);
        break;

      case "person.deleted":
        console.log("Person deleted:", event.data.object.id);
        break;

      case "payout.created":
        console.log("Payout created:", event.data.object.id);
        break;

      case "payout.failed":
        console.log("Payout failed:", event.data.object.id);
        // Handle failed payouts
        break;

      case "payout.paid":
        console.log("Payout paid:", event.data.object.id);
        break;

      case "payout.updated":
        console.log("Payout updated:", event.data.object.id);
        break;

      case "transfer.created":
        console.log("Transfer created:", event.data.object.id);
        break;

      case "transfer.updated":
        console.log("Transfer updated:", event.data.object.id);
        break;

      case "application_fee.created":
        console.log("Application fee created:", event.data.object.id);
        break;

      case "application_fee.refunded":
        console.log("Application fee refunded:", event.data.object.id);
        break;

      default:
        console.log(`Unhandled Connect event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (err) {
    const errorMessage = `Connect webhook signature verification failed. ${
      err instanceof Error ? err.message : "Internal server error"
    }`;
    console.error(errorMessage);
    return c.text(errorMessage, 400);
  }
});

export default app;
