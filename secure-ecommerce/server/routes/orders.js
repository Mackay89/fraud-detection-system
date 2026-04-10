import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// ── Create Order ──────────────────────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentResult } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No order items" });
    }

    // Verify products exist and calculate totals server-side
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ error: `Product not found: ${item.product}` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      verifiedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });

      subtotal += product.price * item.quantity;
    }

    const shippingCost = subtotal > 100 ? 0 : 9.99;
    const tax = subtotal * 0.1;
    const totalAmount = subtotal + shippingCost + tax;

    const order = await Order.create({
      user: req.user._id,
      items: verifiedItems,
      shippingAddress,
      paymentResult,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      isPaid: !!paymentResult,
      paidAt: paymentResult ? new Date() : undefined,
      status: paymentResult ? "paid" : "pending",
    });

    // Decrement stock
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ── Get My Orders ─────────────────────────────────────────────────────────────
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort("-createdAt")
      .populate("items.product", "name image");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ── Get Single Order ──────────────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Only allow owner or admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ── Admin: Get All Orders ─────────────────────────────────────────────────────
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort("-createdAt");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;
