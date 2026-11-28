import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { LoginForm } from "@/components/auth/auth-forms";
import { StaticLoginForm } from "@/components/auth/static-auth";
import { STATIC_MODE } from "@/lib/static-mode";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "bn" ? "লগইন" : "Log in" };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = STATIC_MODE ? null : await getSessionUser();
  if (!STATIC_MODE && user) redirect(user.role.isStaff ? "/admin" : "/account");

  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { next } = await searchParams;
  const loginLabels = {
    name: d.auth.name,
    email: d.auth.email,
    phone: d.auth.phone,
    password: d.auth.password,
    confirmPassword: d.auth.confirmPassword,
    consent: d.auth.consent,
    submit: d.common.login,
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
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-bold tracking-tight">{d.auth.loginTitle}</h1>
          <p className="mt-1 text-sm text-muted">{d.auth.loginSub}</p>

          <div className="mt-6">
            {STATIC_MODE ? (
              <StaticLoginForm
                next={next}
                labels={loginLabels}
              />
            ) : (
              <LoginForm
                next={next}
                labels={loginLabels}
              />
            )}
          </div>

          <p className="mt-5 text-center text-sm text-muted">
            {d.auth.noAccount}{" "}
            <Link href="/register" className="font-semibold text-royal">{d.common.register}</Link>
          </p>
        </div>

        <p className="mt-4 text-center text-[0.7rem] text-muted">
          {bn ? "স্টাফ অ্যাকাউন্ট? একই ফর্মে লগইন করে অ্যাডমিন প্যানেলে যান।" : "Staff account? Log in here and you will be taken to the admin panel."}
        </p>
      </div>
    </div>
  );
}
