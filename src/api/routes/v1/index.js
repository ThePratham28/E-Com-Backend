import { Router } from "express";

const router = Router();

// Example endpoint to verify v1 routing works
router.get("/status", (req, res) => {
  res.json({ status: "ok", version: "v1" });
});

export default router;
