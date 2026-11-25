import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { SERVICE_STATUSES } from "@/lib/status";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Select } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireStaff(PERMISSIONS.APPLICATION_VIEW_ALL);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { status, q } = await searchParams;

  const applications = await prisma.application.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? { OR: [{ trackingId: { contains: q, mode: "insensitive" } }, { customer: { name: { contains: q, mode: "insensitive" } } }] }
        : {}),
    },
    include: { service: true, customer: { select: { name: true, phone: true } }, assignedTo: { select: { name: true } }, documents: true },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title={d.admin.applications} description={bn ? "সব আবেদন, ডকুমেন্ট ও অগ্রগতি।" : "All applications, documents and progress."} />

      <form action="/admin/applications" method="get" className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder={bn ? "ট্র্যাকিং আইডি বা গ্রাহক" : "Tracking ID or customer"} className="input max-w-xs" />
        <Select name="status" defaultValue={status ?? ""} className="max-w-44">
          <option value="">{d.common.all}</option>
          {SERVICE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <button type="submit" className="btn btn-secondary btn-sm">{d.common.filter}</button>
      </form>

      {applications.length === 0 ? (
        <EmptyState title={d.common.noResults} body={d.empty.body} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{bn ? "ট্র্যাকিং" : "Tracking"}</th>
                <th>{d.nav.applications}</th>
                <th>{d.admin.customers}</th>
                <th>{bn ? "ডকুমেন্ট" : "Docs"}</th>
                <th>{d.common.status}</th>
                <th>{bn ? "দায়িত্বপ্রাপ্ত" : "Assigned"}</th>
                <th>{d.common.date}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className="font-medium">{application.trackingId}</td>
                  <td className="text-muted">{bn ? application.service.nameBn : application.service.nameEn}</td>
                  <td className="text-muted">{application.customer.name}</td>
                  <td className="text-muted">{application.documents.length}</td>
                  <td><StatusBadge status={application.status} locale={locale} /></td>
                  <td className="text-muted">{application.assignedTo?.name ?? "—"}</td>
                  <td className="text-muted">{formatDate(application.submittedAt, locale)}</td>
                  <td className="text-right"><Link href={`/admin/applications/${application.id}`} className="text-xs font-semibold text-royal">{d.common.details}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
