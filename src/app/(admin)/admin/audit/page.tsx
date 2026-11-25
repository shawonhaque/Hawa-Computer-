import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { EmptyState, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff(PERMISSIONS.AUDIT_VIEW);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { q } = await searchParams;

  const logs = await prisma.auditLog.findMany({
    where: q ? { OR: [{ action: { contains: q, mode: "insensitive" } }, { entity: { contains: q, mode: "insensitive" } }] } : {},
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title={d.admin.audit} description={bn ? "গুরুত্বপূর্ণ কাজের রেকর্ড।" : "Record of important actions."} />
      <form action="/admin/audit" method="get" className="mb-4 flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder={bn ? "অ্যাকশন বা এন্টিটি" : "Action or entity"} className="input max-w-sm" />
        <button type="submit" className="btn btn-secondary btn-sm">{d.common.search}</button>
      </form>

      {logs.length === 0 ? (
        <EmptyState title={bn ? "কোনো লগ নেই" : "No log entries"} body={d.empty.body} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>{d.common.date}</th><th>{bn ? "ব্যবহারকারী" : "User"}</th><th>{bn ? "অ্যাকশন" : "Action"}</th><th>{bn ? "এন্টিটি" : "Entity"}</th><th>ID</th><th>Meta</th></tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap text-muted">{formatDateTime(log.createdAt, locale)}</td>
                  <td className="text-muted">{log.user?.name ?? "system"}</td>
                  <td className="font-medium">{log.action}</td>
                  <td className="text-muted">{log.entity}</td>
                  <td className="font-mono text-[0.65rem] text-muted">{log.entityId?.slice(0, 10) ?? "—"}</td>
                  <td className="max-w-48 truncate text-[0.65rem] text-muted">{JSON.stringify(log.meta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
