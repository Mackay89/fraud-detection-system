import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "https://via.placeholder.com/400x300?text=Product" },
    category: {
      type: String,
      required: true,
      enum: ["electronics", "clothing", "books", "home", "sports", "other"],
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

export default mongoose.model("Product", productSchema);
