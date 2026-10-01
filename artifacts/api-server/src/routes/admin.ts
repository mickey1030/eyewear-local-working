import { Router } from "express";
import crypto from "node:crypto";
import { env } from "../env";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

function passwordMatches(candidate: string): boolean {
  if (!env.adminPassword) return false; // admin disabled until ADMIN_PASSWORD is configured
  const a = crypto.createHash("sha256").update(candidate).digest();
  const b = crypto.createHash("sha256").update(env.adminPassword).digest();
  return crypto.timingSafeEqual(a, b);
}

const cookieOptions = {
  httpOnly: true,
  signed: true,
  sameSite: "strict" as const,
  secure: env.cookieSecure,
};

router.post("/api/admin/login", (req, res) => {
  const { password } = (req.body ?? {}) as { password?: unknown };
  if (typeof password !== "string" || !password || !passwordMatches(password)) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  res.cookie("am_admin", "1", { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  res.json({ ok: true });
});

router.post("/api/admin/logout", (_req, res) => {
  res.clearCookie("am_admin", cookieOptions);
  res.json({ ok: true });
});

router.get("/api/admin/me", requireAdmin, (_req, res) => {
  res.json({ authenticated: true });
});

export default router;
