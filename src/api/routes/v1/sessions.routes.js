import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import {
  listSessionsQuery,
  revokeBody,
  revokeParams,
} from "../../dtos/session.dto.js";
import { Session } from "../../../models/index.js";

const router = Router();

// List sessions for current user
router.get(
  "/",
  requireAuth,
  validate({ query: listSessionsQuery }),
  async (req, res, next) => {
    try {
      const { limit = 20, cursor } = req.query;
      const filter = { user: req.user.id };
      if (cursor) {
        filter._id = { $lt: cursor };
      }
      const sessions = await Session.find(filter)
        .sort({ _id: -1 })
        .limit(Number(limit))
        .select(
          "jti deviceId ip userAgent lastUsedAt createdAt expiresAt revokedAt reuseDetectedAt"
        )
        .lean();

      const nextCursor = sessions.length
        ? sessions[sessions.length - 1]._id
        : null;
      res.json({ items: sessions, nextCursor });
    } catch (e) {
      next(e);
    }
  }
);

// Revoke sessions by body: all | deviceId | jti
router.post(
  "/revoke",
  requireAuth,
  validate({ body: revokeBody }),
  async (req, res, next) => {
    try {
      const { all, deviceId, jti } = req.body;
      const baseFilter = { user: req.user.id, revokedAt: { $exists: false } };

      if (all) {
        await Session.updateMany(baseFilter, {
          $set: { revokedAt: new Date() },
        });
        return res.json({ success: true, scope: "all" });
      }
      if (deviceId) {
        await Session.updateMany(
          { ...baseFilter, deviceId },
          { $set: { revokedAt: new Date() } }
        );
        return res.json({ success: true, scope: "device", deviceId });
      }
      if (jti) {
        const result = await Session.updateOne(
          { ...baseFilter, jti },
          { $set: { revokedAt: new Date() } }
        );
        return res.json({
          success: result.modifiedCount > 0,
          scope: "jti",
          jti,
        });
      }
      return res
        .status(400)
        .json({ message: "Provide either all=true, deviceId, or jti" });
    } catch (e) {
      next(e);
    }
  }
);

// Revoke by param jti
router.delete(
  "/:jti",
  requireAuth,
  validate({ params: revokeParams }),
  async (req, res, next) => {
    try {
      const { jti } = req.params;
      const result = await Session.updateOne(
        { user: req.user.id, jti, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
      );
      res.json({ success: result.modifiedCount > 0 });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
