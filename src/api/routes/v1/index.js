import { Router } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

// Example endpoint to verify v1 routing works
router.get("/status", (req, res) => {
  res.json({ status: "ok", version: "v1" });
});

router.use("/auth", authRoutes);

export default router;
