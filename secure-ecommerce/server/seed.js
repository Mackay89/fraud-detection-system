import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import User from "./models/User.js";

dotenv.config();

const products = [
  {
    name: "Wireless Noise-Cancelling Headphones",
    description: "Premium over-ear headphones with 30-hour battery life, active noise cancellation, and studio-quality sound.",
    price: 249.99,
    category: "electronics",
    stock: 50,
    featured: true,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    ratings: { average: 4.8, count: 124 },
  },
  {
    name: "Minimalist Leather Watch",
    description: "Handcrafted genuine leather strap with sapphire crystal glass and Swiss movement. Water resistant to 50m.",
    price: 189.99,
    category: "clothing",
    stock: 30,
    featured: true,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    ratings: { average: 4.6, count: 89 },
  },
  {
    name: "Mechanical Keyboard — Compact 65%",
    description: "Hot-swappable tactile switches, aluminium case, per-key RGB backlighting. USB-C connection.",
    price: 129.99,
    category: "electronics",
    stock: 40,
    featured: true,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
    ratings: { average: 4.9, count: 201 },
  },
  {
    name: "Yoga Mat — Cork & Rubber",
    description: "Eco-friendly natural cork surface for superior grip, thick 6mm rubber base for joint support.",
    price: 79.99,
    category: "sports",
    stock: 100,
    featured: false,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&q=80",
    ratings: { average: 4.5, count: 67 },
  },
  {
    name: "The Design of Everyday Things",
    description: "Don Norman's classic work on user-centered design. Revised and expanded edition. Essential reading for designers.",
    price: 24.99,
    category: "books",
    stock: 200,
    featured: false,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
    ratings: { average: 4.7, count: 445 },
  },
  {
    name: "Smart LED Desk Lamp",
    description: "Touch-sensitive, 5 color temperatures, 10 brightness levels, USB charging port, memory function.",
    price: 59.99,
    category: "home",
    stock: 75,
    featured: true,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80",
    ratings: { average: 4.4, count: 156 },
  },
  {
    name: "Merino Wool Hoodie",
    description: "Ultra-soft 100% merino wool hoodie. Naturally temperature-regulating, odor-resistant. Machine washable.",
    price: 149.99,
    category: "clothing",
    stock: 60,
    featured: true,
    image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80",
    ratings: { average: 4.8, count: 93 },
  },
  {
    name: "Portable Espresso Maker",
    description: "Hand-powered espresso maker. No electricity needed. Compatible with ground coffee and pods. Travel-ready.",
    price: 49.99,
    category: "home",
    stock: 120,
    featured: false,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
    ratings: { average: 4.3, count: 78 },
  },
];

const users = [
  {
    name: "Admin User",
    email: "admin@secureshop.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    password: "password123",
    role: "user",
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/secureshop");
  console.log("✅ Connected to MongoDB");

  await Product.deleteMany({});
  await User.deleteMany({});
  console.log("🗑️  Cleared existing data");

  await Product.insertMany(products);
  console.log(`✅ Seeded ${products.length} products`);

  for (const userData of users) {
    await User.create(userData);
  }
  console.log(`✅ Seeded ${users.length} users`);

  console.log("\n📋 Test Credentials:");
  console.log("  Admin: admin@secureshop.com / admin123");
  console.log("  User:  jane@example.com / password123");

  await mongoose.disconnect();
  console.log("\n🎉 Database seeded successfully!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
