import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { signAccessToken, issueRefreshToken } from "../utils/tokens.js";
import { refreshCookieConfig, REFRESH_COOKIE } from "./auth.controller.js";
import type { UserDoc } from "../models/User.js";


export async function handleOAuthCallback(req: Request, res: Response) {
  const user = req.user as UserDoc;

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id as string);

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieConfig);

  const redirectUrl = new URL("/oauth/callback", env.FRONTEND_URL);
  redirectUrl.searchParams.set("access_token", accessToken);
  res.redirect(redirectUrl.toString());
}
