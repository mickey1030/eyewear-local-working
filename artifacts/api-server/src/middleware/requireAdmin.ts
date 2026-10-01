import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.signedCookies?.am_admin === "1") {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}
