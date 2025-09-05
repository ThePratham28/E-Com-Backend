import { Router } from "express";
import validate from "../../middlewares/validate.js";
import {
  registerDto,
  loginDto,
  refreshDto,
  logoutDto,
} from "../../dtos/auth.dto.js";
import * as Auth from "../../services/auth.service.js";
import config from "../../../configs/config.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();

function setAuthCookies(res, { accessToken, refreshToken }) {
  const cookieOpts = {
    httpOnly: true,
    secure: config.cookies.secure,
    sameSite: "lax",
    path: "/",
    domain: config.cookies.domain || undefined,
  };
  if (accessToken)
    res.cookie("accessToken", accessToken, {
      ...cookieOpts,
      maxAge: 10 * 60 * 1000,
    });
  if (refreshToken)
    res.cookie("refreshToken", refreshToken, {
      ...cookieOpts,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
}

router.post(
  "/register",
  validate({ body: registerDto }),
  async (req, res, next) => {
    try {
      const user = await Auth.register(req.body);
      res.status(201).json({ user });
    } catch (e) {
      next(e);
    }
  }
);

router.post("/login", validate({ body: loginDto }), async (req, res, next) => {
  try {
    const { email, password, deviceId } = req.body;
    const result = await Auth.login({
      email,
      password,
      deviceId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    setAuthCookies(res, result);
    res.json({ user: result.user, deviceId: result.deviceId });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/refresh",
  validate({ body: refreshDto }),
  async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken)
        return res.status(401).json({ message: "No refresh token" });
      const result = await Auth.refresh({
        refreshToken,
        deviceId: req.body.deviceId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });
      setAuthCookies(res, result);
      res.json({ deviceId: result.deviceId });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/logout",
  requireAuth,
  validate({ body: logoutDto }),
  async (req, res, next) => {
    try {
      const { deviceId, allDevices } = req.body;
      await Auth.logout({ userId: req.user.id, deviceId, allDevices });
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
