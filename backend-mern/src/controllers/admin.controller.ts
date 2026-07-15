import type { Request, Response } from "express";
import { User, PROMOTABLE_ROLES, type PromotableRole } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { revokeAllRefreshTokensForUser } from "../utils/tokens.js";

/** GET /api/admin/users */
export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().select("_id name email role provider").sort({ createdAt: 1 });

  res.json({
    users: users.map((u) => ({
      id: u.id as string,
      name: u.name,
      email: u.email,
      role: u.role,
      provider: u.provider,
    })),
  });
}

/**
 * PATCH /api/admin/users/:id/role
 *
 **/
export async function updateUserRole(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body as { role: PromotableRole };

  if (!PROMOTABLE_ROLES.includes(role)) {
    throw ApiError.badRequest("The admin role can only be granted directly in the database.");
  }

  const target = await User.findById(id);
  if (!target) throw ApiError.notFound("User not found.");

  if (target.role === "admin") {
    throw ApiError.forbidden("Admin accounts can't be changed from the API.");
  }
  if (target.id === req.auth?.userId) {
    throw ApiError.badRequest("You can't change your own role.");
  }

  target.role = role;
  await target.save();

  await revokeAllRefreshTokensForUser(target.id as string);

  res.json({
    user: { id: target.id as string, name: target.name, email: target.email, role: target.role },
  });
}
