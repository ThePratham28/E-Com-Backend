import { verifyAccessToken } from "../../utils/jwt.js";
import { User } from "../../models/index.js";

function getTokenFromReq(req) {
  const bearer = req.headers.authorization || "";
  if (bearer.startsWith("Bearer ")) return bearer.substring(7);
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const { payload } = await verifyAccessToken(token);
    const userId = payload.sub;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.user = {
      id: String(user._id),
      role: user.role,
      scopes: payload.scopes || [],
    };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };

export const requireScopes =
  (...scopes) =>
  (req, res, next) => {
    const userScopes = new Set(req.user?.scopes || []);
    if (!scopes.every((s) => userScopes.has(s)))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };

export default { requireAuth, requireRole, requireScopes };
