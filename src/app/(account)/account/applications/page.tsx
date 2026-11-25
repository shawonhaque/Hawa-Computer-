import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AccountApplicationsPage() {
  const user = await requireUser("/account/applications");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const applications = await prisma.application.findMany({
    where: { customerId: user.id },
    include: { service: true, documents: true },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title={d.account.applications} description={bn ? "প্রতিটি আবেদনের ট্র্যাকিং আইডি ও স্ট্যাটাস।" : "Tracking ID and status for every application."} />
      {applications.length === 0 ? (
        <EmptyState
          icon={<FileText size={22} />}
          title={d.account.noApplications}
          body={d.empty.body}
          action={<Link href="/applications" className="btn btn-primary btn-sm">{d.nav.applications}</Link>}
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{bn ? "ট্র্যাকিং আইডি" : "Tracking ID"}</th>
                <th>{d.nav.applications}</th>
                <th>{d.common.date}</th>
                <th>{bn ? "ডকুমেন্ট" : "Documents"}</th>
                <th>{d.common.status}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="font-medium">{application.trackingId}</td>
                  <td className="text-muted">{bn ? application.service.nameBn : application.service.nameEn}</td>
                  <td className="text-muted">{formatDate(application.submittedAt, locale)}</td>
                  <td className="text-muted">{application.documents.length}</td>
                  <td><StatusBadge status={application.status} locale={locale} /></td>
                  <td className="text-right"><Link href={`/account/applications/${application.id}`} className="text-xs font-semibold text-royal">{d.common.details}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
