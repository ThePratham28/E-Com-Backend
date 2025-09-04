import { Router } from "express";

// Central API router: import and mount all sub-routers here
const router = Router();

// Example: when you create files like `auth.routes.js`, `products.routes.js`, etc.
// import authRoutes from "./auth.routes.js";
// import productsRoutes from "./products.routes.js";
// router.use("/auth", authRoutes);
// router.use("/products", productsRoutes);

// Health check or base ping
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
