import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

export const ROLES = ["user", "manager", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PROMOTABLE_ROLES = ["user", "manager"] as const;
export type PromotableRole = (typeof PROMOTABLE_ROLES)[number];

const PROVIDERS = ["password", "google", "github"] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, select: false },

    role: { type: String, enum: ROLES, default: "user", required: true },
    provider: { type: String, enum: PROVIDERS, default: "password", required: true },
    providerId: { type: String, select: false }, 

    avatarInitials: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ provider: 1, providerId: 1 });

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends UserDoc {}
  }
}

export const User = model("User", userSchema);

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "??";
}

export function toPublicUser(user: UserDoc) {
  return {
    id: user.id as string,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarInitials: user.avatarInitials,
    provider: user.provider,
  };
}
