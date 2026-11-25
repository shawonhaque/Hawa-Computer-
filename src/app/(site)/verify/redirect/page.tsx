import { redirect } from "next/navigation";

export default async function VerifyRedirect({ searchParams }: { searchParams: Promise<{ certNo?: string }> }) {
  const { certNo } = await searchParams;
  const clean = (certNo ?? "").trim();
  if (!clean) redirect("/verify");
  redirect(`/verify/${encodeURIComponent(clean)}`);
}
