import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokens";
import { User } from "../models/User.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: string };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing access token.");
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);

    
    const user = await User.findById(payload.sub).select("_id role");
    if (!user) throw ApiError.unauthorized("Session no longer valid.");

    req.auth = { userId: user.id as string, role: user.role };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized("Invalid or expired access token."));
  }
}
