import express from "express";
import Stripe from "stripe";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── Create Payment Intent ─────────────────────────────────────────────────────
router.post("/create-intent", protect, async (req, res) => {
  if (!process.env.STRIPE_KEY) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  const stripe = new Stripe(process.env.STRIPE_KEY);

  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: { userId: req.user._id.toString() },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
