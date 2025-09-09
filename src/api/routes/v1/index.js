import { Router } from "express";
import authRoutes from "./auth.routes.js";
import sessionsRoutes from "./sessions.routes.js";
import categoryRoutes from "./category.routes.js";

const router = Router();

// Example endpoint to verify v1 routing works
router.get("/status", (req, res) => {
  res.json({ status: "ok", version: "v1" });
});

router.use("/auth", authRoutes);
router.use("/sessions", sessionsRoutes);
router.use("/categories", categoryRoutes);

export default router;
