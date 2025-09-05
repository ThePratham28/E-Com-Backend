import { addDays } from "date-fns";
import argon2 from "argon2";
import { User, Session } from "../../models/index.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";

async function hashToken(token) {
  return argon2.hash(token, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function register({ username, email, password }) {
  const user = await User.create({ username, email, password });
  return user.toJSON();
}

export async function login({ email, password, deviceId, ip, userAgent }) {
  const user = await User.findOne({ email }).select("+password role");
  if (!user) throw new Error("Invalid credentials");
  const ok = await user.comparePassword(password);
  if (!ok) throw new Error("Invalid credentials");

  const device = deviceId || "web:" + (userAgent?.slice(0, 40) || "unknown");

  const accessToken = await signAccessToken({ sub: user.id, role: user.role });
  const { token: refreshToken, jti } = await signRefreshToken({
    sub: user.id,
    deviceId: device,
  });

  const hashedToken = await hashToken(refreshToken);
  const expiresAt = addDays(new Date(), 30); // default 30d, align with config if needed
  await Session.create({
    user: user._id,
    deviceId: device,
    jti,
    hashedToken,
    ip,
    userAgent,
    expiresAt,
  });

  return { accessToken, refreshToken, user: user.toJSON(), deviceId: device };
}

export async function refresh({ refreshToken, deviceId, ip, userAgent }) {
  const { payload } = await verifyRefreshToken(refreshToken);
  const jti = payload.jti;
  const sub = payload.sub;
  const device = payload.deviceId || deviceId;

  // find session by jti
  const session = await Session.findOne({ jti, user: sub });
  if (!session || session.revokedAt) {
    // reuse or invalid
    if (session && !session.reuseDetectedAt) {
      session.reuseDetectedAt = new Date();
      session.revokedAt = new Date();
      await session.save();
    }
    throw new Error("Invalid session");
  }

  const matches = await argon2.verify(session.hashedToken, refreshToken);
  if (!matches) {
    session.reuseDetectedAt = new Date();
    session.revokedAt = new Date();
    await session.save();
    throw new Error("Token reuse detected");
  }

  // rotate tokens
  const accessToken = await signAccessToken({ sub, role: undefined });
  const { token: newRefreshToken, jti: newJti } = await signRefreshToken({
    sub,
    deviceId: device,
  });
  session.hashedToken = await hashToken(newRefreshToken);
  session.jti = newJti;
  session.lastUsedAt = new Date();
  session.ip = ip || session.ip;
  session.userAgent = userAgent || session.userAgent;
  await session.save();

  return { accessToken, refreshToken: newRefreshToken, deviceId: device };
}

export async function logout({ userId, deviceId, allDevices = false }) {
  if (allDevices) {
    await Session.updateMany(
      { user: userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
    return { success: true };
  }
  if (deviceId) {
    await Session.updateMany(
      { user: userId, deviceId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
  }
  return { success: true };
}

export default { register, login, refresh, logout };
