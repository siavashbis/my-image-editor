"use server";

import { auth } from "~/lib/auth";

import { headers } from "next/headers";
import { db } from "~/server/db";

export async function getUserCredits() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { credits: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return user.credits;
}