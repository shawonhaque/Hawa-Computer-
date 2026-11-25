"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE } from "@/lib/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const user = await getSessionUser();
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { locale } }).catch(() => null);
  }
  revalidatePath("/", "layout");
}
