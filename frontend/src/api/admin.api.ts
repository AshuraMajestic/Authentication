import type { ApiResult } from "../types/auth";
import { api } from "./client";
import { ENDPOINTS } from "./endpoints";

export const PROMOTABLE_ROLES = ["user", "manager"] as const;
export type PromotableRole = (typeof PROMOTABLE_ROLES)[number];

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
}

export async function listUsers(): Promise<ApiResult<DirectoryUser[]>> {
  return api.get(ENDPOINTS.admin.users);
}

export async function updateUserRole(
  userId: string,
  nextRole: "user" | "manager"
): Promise<ApiResult<DirectoryUser>> {
  return api.patch(ENDPOINTS.admin.updateRole(userId), { role: nextRole });
}