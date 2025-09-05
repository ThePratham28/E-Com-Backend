import { createPrivateKey, createPublicKey, randomUUID } from "crypto";
import * as jose from "jose";
import config from "../configs/config.js";

function normalizePem(pem) {
  if (!pem) return pem;
  // Support single-line env vars with literal \n
  return pem.replace(/\\n/g, "\n").trim();
}

function detectAlgFromPem(pem) {
  if (!pem) return "RS256"; // default
  if (pem.includes("EC PRIVATE KEY") || pem.includes("EC PUBLIC KEY"))
    return "ES256";
  if (pem.includes("BEGIN PRIVATE KEY") || pem.includes("BEGIN PUBLIC KEY"))
    return "RS256"; // PKCS#8/SPKI
  if (pem.includes("RSA PRIVATE KEY") || pem.includes("RSA PUBLIC KEY"))
    return "RS256"; // PKCS#1
  return "RS256";
}

function getKeyPair(kind) {
  const conf = config.jwt[kind];
  const privRaw = conf.privateKey;
  const pubRaw = conf.publicKey;

  if (privRaw && pubRaw) {
    const priv = normalizePem(privRaw);
    const pub = normalizePem(pubRaw);
    const alg = detectAlgFromPem(priv) || "RS256";
    try {
      const privType = priv.includes("RSA PRIVATE KEY") ? "pkcs1" : "pkcs8";
      const pubType = pub.includes("RSA PUBLIC KEY") ? "pkcs1" : "spki";
      const privateKey = createPrivateKey({
        key: priv,
        format: "pem",
        type: privType,
      });
      const publicKey = createPublicKey({
        key: pub,
        format: "pem",
        type: pubType,
      });
      return { privateKey, publicKey, alg };
    } catch (e) {
      // Graceful fallback to HMAC if PEMs are malformed or OpenSSL cannot decode
      const secret = new TextEncoder().encode(
        process.env.JWT_FALLBACK_SECRET || config.NODE_ENV
      );
      return { secret, alg: "HS256" };
    }
  }
  // Fallback to HMAC using a secret when keypair is not provided
  const secret = new TextEncoder().encode(
    process.env.JWT_FALLBACK_SECRET || config.NODE_ENV
  );
  return { secret, alg: "HS256" };
}

const accessKeys = getKeyPair("access");
const refreshKeys = getKeyPair("refresh");

export async function signAccessToken({ sub, role, scopes = [], extra = {} }) {
  const jti = randomUUID();
  const payload = { ...extra, role, scopes };
  const header = { typ: "JWT" };
  const ttl = config.jwt.access.ttl;

  if (accessKeys.privateKey) {
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: accessKeys.alg, ...header })
      .setSubject(String(sub))
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime(ttl)
      .sign(accessKeys.privateKey);
  }
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: accessKeys.alg, ...header })
    .setSubject(String(sub))
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(accessKeys.secret);
}

export async function signRefreshToken({ sub, deviceId, extra = {} }) {
  const jti = randomUUID();
  const payload = { ...extra, deviceId };
  const header = { typ: "JWT" };
  const ttl = config.jwt.refresh.ttl;

  if (refreshKeys.privateKey) {
    return {
      token: await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: refreshKeys.alg, ...header })
        .setSubject(String(sub))
        .setJti(jti)
        .setIssuedAt()
        .setExpirationTime(ttl)
        .sign(refreshKeys.privateKey),
      jti,
    };
  }
  return {
    token: await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: refreshKeys.alg, ...header })
      .setSubject(String(sub))
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime(ttl)
      .sign(refreshKeys.secret),
    jti,
  };
}

export async function verifyAccessToken(token) {
  try {
    if (accessKeys.publicKey) {
      return await jose.jwtVerify(token, accessKeys.publicKey);
    }
    return await jose.jwtVerify(token, accessKeys.secret);
  } catch (e) {
    const err = new Error("Invalid access token");
    err.cause = e;
    throw err;
  }
}

export async function verifyRefreshToken(token) {
  try {
    if (refreshKeys.publicKey) {
      return await jose.jwtVerify(token, refreshKeys.publicKey);
    }
    return await jose.jwtVerify(token, refreshKeys.secret);
  } catch (e) {
    const err = new Error("Invalid refresh token");
    err.cause = e;
    throw err;
  }
}
