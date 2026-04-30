import express from "express";
import { body, validationResult } from "express-validator";

const router = express.Router();

// ─── Validation Middleware ────────────────────────────────────────────────────
const validateShipping = [
  body("shipping.firstName").trim().notEmpty().withMessage("First name is required"),
  body("shipping.lastName").trim().notEmpty().withMessage("Last name is required"),
  body("shipping.email").isEmail().withMessage("Valid email is required"),
  body("shipping.phone").trim().notEmpty().withMessage("Phone number is required"),
  body("shipping.address").trim().notEmpty().withMessage("Street address is required"),
  body("shipping.city").trim().notEmpty().withMessage("City is required"),
  body("shipping.postalCode").trim().notEmpty().withMessage("Postal code is required"),
  body("shipping.country").trim().notEmpty().withMessage("Country is required"),
  body("shipping.shippingMethod")
    .isIn(["standard", "express", "overnight"])
    .withMessage("Invalid shipping method"),
];

const validatePayment = [
  body("payment.method")
    .isIn(["card", "bank", "paypal", "applepay", "googlepay", "crypto"])
    .withMessage("Invalid payment method"),

  // Card-specific
  body("payment.cardNumber")
    .if(body("payment.method").equals("card"))
    .trim().notEmpty().withMessage("Card number is required"),
  body("payment.cardName")
    .if(body("payment.method").equals("card"))
    .trim().notEmpty().withMessage("Cardholder name is required"),
  body("payment.expiry")
    .if(body("payment.method").equals("card"))
    .trim().notEmpty().withMessage("Expiry date is required"),
  body("payment.cvv")
    .if(body("payment.method").equals("card"))
    .trim().notEmpty().withMessage("CVV is required"),

  // Bank-specific
  body("payment.bankName")
    .if(body("payment.method").equals("bank"))
    .trim().notEmpty().withMessage("Bank name is required"),
  body("payment.accountHolder")
    .if(body("payment.method").equals("bank"))
    .trim().notEmpty().withMessage("Account holder name is required"),
  body("payment.accountNumber")
    .if(body("payment.method").equals("bank"))
    .trim().notEmpty().withMessage("Account number is required"),

  // Crypto-specific
  body("payment.crypto")
    .if(body("payment.method").equals("crypto"))
    .trim().notEmpty().withMessage("Cryptocurrency selection is required"),
];

// ─── Shipping Cost Calculator ─────────────────────────────────────────────────
function getShippingCost(method) {
  const costs = { standard: 9.99, express: 19.99, overnight: 34.99 };
  return costs[method] ?? 9.99;
}

// ─── Mock Payment Processor ───────────────────────────────────────────────────
async function processPayment(method, paymentDetails, amount) {
  // In production: integrate Stripe, PayFast, Flutterwave, etc.
  // For card: use Stripe's PaymentIntent API
  // For bank: use Stripe ACH / local bank APIs
  // For PayPal: use PayPal Orders API
  // For crypto: use Coinbase Commerce or similar

  const processors = {
    card: "Stripe",
    bank: "BankTransfer",
    paypal: "PayPal",
    applepay: "ApplePay",
    googlepay: "GooglePay",
    crypto: "CoinbaseCommerce",
  };

  return {
    success: true,
    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    processor: processors[method],
    amount,
    currency: "USD",
    timestamp: new Date().toISOString(),
  };
}

// ─── POST /api/payment/process ────────────────────────────────────────────────
router.post(
  "/process",
  [...validateShipping, ...validatePayment],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { shipping, payment, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Order must contain at least one item" });
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingCost = getShippingCost(shipping.shippingMethod);
      const tax = parseFloat((subtotal * 0.1).toFixed(2));
      const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));

      // Sanitize payment details before processing (never log sensitive data)
      const sanitizedPayment = { method: payment.method };
      if (payment.method === "card") {
        sanitizedPayment.last4 = payment.cardNumber?.slice(-4);
        sanitizedPayment.cardName = payment.cardName;
      } else if (payment.method === "bank") {
        sanitizedPayment.bankName = payment.bankName;
        sanitizedPayment.accountHolder = payment.accountHolder;
      } else if (payment.method === "crypto") {
        sanitizedPayment.crypto = payment.crypto;
      }

      // Process payment
      const result = await processPayment(payment.method, payment, total);

      if (!result.success) {
        return res.status(402).json({ error: "Payment processing failed", details: result.error });
      }

      // Build order record
      const order = {
        orderId: `ORD-${Date.now()}`,
        transactionId: result.transactionId,
        processor: result.processor,
        status: payment.method === "bank" ? "pending_transfer" : "confirmed",
        items,
        shipping: {
          name: `${shipping.firstName} ${shipping.lastName}`,
          email: shipping.email,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          state: shipping.state || "",
          postalCode: shipping.postalCode,
          country: shipping.country,
          method: shipping.shippingMethod,
          cost: shippingCost,
        },
        payment: sanitizedPayment,
        pricing: { subtotal, shipping: shippingCost, tax, total },
        createdAt: new Date().toISOString(),
      };

      // TODO: Save order to MongoDB
      // await Order.create(order);
      // TODO: Send confirmation email
      // await sendOrderConfirmationEmail(shipping.email, order);

      return res.status(201).json({
        success: true,
        message: payment.method === "bank"
          ? "Order received. Awaiting bank transfer confirmation."
          : "Order placed successfully!",
        order,
      });

    } catch (err) {
      console.error("Payment processing error:", err);
      return res.status(500).json({ error: "Internal server error during payment processing" });
    }
  }
);

// ─── GET /api/payment/methods ─────────────────────────────────────────────────
router.get("/methods", (req, res) => {
  res.json({
    methods: [
      { id: "card", label: "Credit / Debit Card", enabled: true },
      { id: "bank", label: "Bank Transfer", enabled: true },
      { id: "paypal", label: "PayPal", enabled: true },
      { id: "applepay", label: "Apple Pay", enabled: true },
      { id: "googlepay", label: "Google Pay", enabled: true },
      { id: "crypto", label: "Cryptocurrency", enabled: true },
    ],
  });
});

// ─── POST /api/payment/calculate-shipping ─────────────────────────────────────
router.post("/calculate-shipping", (req, res) => {
  const { method } = req.body;
  if (!["standard", "express", "overnight"].includes(method)) {
    return res.status(400).json({ error: "Invalid shipping method" });
  }
  res.json({ method, cost: getShippingCost(method) });
});

export default router;
