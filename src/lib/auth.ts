import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { verifyPassword } from "./password";
import type { Provider } from "next-auth/providers";

const providers: Provider[] = [];

// ─── Production Credentials Provider (Email + Password) ───
providers.push(
  Credentials({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const email = (credentials.email as string).toLowerCase().trim();
      const password = credentials.password as string;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return null;

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name };
    },
  })
);

// ─── Dev Login (development only) ───
if (process.env.NODE_ENV === "development") {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email as string;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              emailVerified: new Date(),
              accountType: "landlord",
            },
          });
          // Auto-create org for dev users
          await prisma.organization.create({
            data: {
              name: `${email.split("@")[0]}'s Workspace`,
              members: {
                create: {
                  userId: user.id,
                  role: "owner",
                },
              },
            },
          });
        }
        return user;
      },
    })
  );
}

// ─── Social Login (optional, env-gated) ───
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // Fetch accountType from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { accountType: true },
        });
        token.accountType = dbUser?.accountType ?? null;
      }
      // Allow updating token when accountType is set during onboarding
      if (trigger === "update" && session?.accountType) {
        token.accountType = session.accountType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.accountType = (token.accountType as string) ?? null;
      }
      return session;
    },
  },
});
