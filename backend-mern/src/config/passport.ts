import passport from "passport";
import { Strategy as GoogleStrategy, type Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GitHubStrategy, type Profile as GitHubProfile } from "passport-github2";
import { env } from "./env";
import { User, initialsFromName, type UserDoc } from "../models/User";

async function findOrCreateOAuthUser(params: {
  provider: "google" | "github";
  providerId: string;
  email: string | undefined;
  name: string;
}): Promise<UserDoc> {
  const { provider, providerId, email, name } = params;

  const byProviderId = await User.findOne({ provider, providerId });
  if (byProviderId) return byProviderId;

  if (email) {
    const byEmail = await User.findOne({ email: email.toLowerCase() });
    if (byEmail) {
      byEmail.provider = provider;
      byEmail.providerId = providerId;
      byEmail.isEmailVerified = true;
      await byEmail.save();
      return byEmail;
    }
  }


  const created = await User.create({
    name,
    email: email?.toLowerCase() ?? `${provider}_${providerId}@no-email.securegate.dev`,
    role: "user",
    provider,
    providerId,
    avatarInitials: initialsFromName(name),
    isEmailVerified: Boolean(email),
  });
  return created;
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      (_accessToken, _refreshToken, profile: GoogleProfile, done) => {
        findOrCreateOAuthUser({
          provider: "google",
          providerId: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName || "Google User",
        })
          .then((user) => done(null, user))
          .catch(done);
      }
    )
  );
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_CALLBACK_URL) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
      },
      (
        _accessToken: string,
        _refreshToken: string,
        profile: GitHubProfile,
        done: (err: unknown, user?: Express.User | false) => void
      ) => {
        findOrCreateOAuthUser({
          provider: "github",
          providerId: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName || profile.username || "GitHub User",
        })
          .then((user) => done(null, user))
          .catch(done);
      }
    )
  );
}

export default passport;
