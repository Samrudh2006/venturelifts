import type { FastifyInstance } from "fastify";
import { z } from "zod";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const PRICE_ID = process.env.STRIPE_PRICE_ID || "price_placeholder";

export default async function billingRoutes(instance: FastifyInstance) {
  instance.post("/create-checkout", { preHandler: [(instance as any).authenticate] }, async (request, reply) => {
    if (!STRIPE_SECRET_KEY) return reply.status(501).send({ error: "Stripe not configured. Set STRIPE_SECRET_KEY." });

    const req = request as any;

    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: PRICE_ID, quantity: 1 }],
        success_url: `${request.headers.origin || "http://localhost:5173"}/billing?success=1`,
        cancel_url: `${request.headers.origin || "http://localhost:5173"}/billing?canceled=1`,
        metadata: { userId: String(req.user?.id) },
      });

      return { url: session.url };
    } catch (err: any) {
      return reply.status(500).send({ error: "Failed to create checkout session", details: err.message });
    }
  });

  instance.post("/webhook", async (request, reply) => {
    if (!STRIPE_SECRET_KEY) return reply.status(501).send({ error: "Stripe not configured" });

    const sig = request.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY);
      const body = request.body as string;
      const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        console.log(`Subscription completed for user ${session.metadata.userId}`);
      }

      return { received: true };
    } catch (err: any) {
      return reply.status(400).send({ error: "Webhook signature verification failed" });
    }
  });

  instance.get("/plans", async () => {
    return {
      plans: [
        { id: "free", name: "Free", price: 0, features: ["1 venture profile", "Basic AI validation", "Community mentor matching"] },
        { id: "pro", name: "Pro", price: 19, features: ["Unlimited ventures", "Advanced AI validation", "Priority mentor matching", "PDF export reports", "Comment threads"], recommended: true },
        { id: "enterprise", name: "Enterprise", price: 99, features: ["Everything in Pro", "SSO/OAuth", "Admin analytics", "Custom integrations", "Dedicated support"] },
      ],
    };
  });
}
