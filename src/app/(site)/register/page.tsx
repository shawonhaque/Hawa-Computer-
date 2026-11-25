import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { RegisterForm } from "@/components/auth/auth-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "bn" ? "রেজিস্ট্রেশন" : "Sign up" };
}

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-xl">
        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-bold tracking-tight">{d.auth.registerTitle}</h1>
          <p className="mt-1 text-sm text-muted">{d.auth.registerSub}</p>

          <div className="mt-6">
            <RegisterForm
              labels={{
                name: d.auth.name,
                email: d.auth.email,
                phone: d.auth.phone,
                password: d.auth.password,
                confirmPassword: d.auth.confirmPassword,
                consent: d.auth.consent,
                submit: d.common.register,
                invalid: d.auth.invalid,
                exists: d.auth.exists,
                required: d.validation.required,
                emailInvalid: d.validation.email,
                phoneInvalid: d.validation.phone,
                min: bn ? "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে" : "Password must be at least 8 characters",
                mismatch: d.validation.passwordMatch,
                consentRequired: d.validation.consent,
                rateLimited: bn ? "অনেকবার চেষ্টা হয়েছে, একটু পরে আবার চেষ্টা করুন" : "Too many attempts, please try again shortly",
                suspended: bn ? "এই অ্যাকাউন্টটি স্থগিত" : "This account is suspended",
                setup: bn ? "সেটআপ অসম্পূর্ণ" : "Setup incomplete",
              }}
            />
          </div>

          <p className="mt-5 text-center text-sm text-muted">
            {d.auth.haveAccount}{" "}
            <Link href="/login" className="font-semibold text-royal">{d.common.login}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
