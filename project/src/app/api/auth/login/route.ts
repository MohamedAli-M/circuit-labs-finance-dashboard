import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import type { UserFile } from "@/lib/types";

/**
 * POST /api/auth/login - verify credentials against user.json.
 * On success returns the user WITHOUT the password (the contract guarantees it:
 * we destructure the password away and return a PublicUser).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const file = JSON.parse(
    readFileSync(join(process.cwd(), "data", "users", "user.json"), "utf-8"),
  ) as UserFile;

  const match = file.users.find(
    (u) =>
      u.email.toLowerCase() === body.email!.toLowerCase() &&
      u.password === body.password,
  );

  if (!match) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const { password: _password, ...publicUser } = match;
  return NextResponse.json({ user: publicUser });
}
