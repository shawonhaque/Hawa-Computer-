import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDate } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff(PERMISSIONS.CUSTOMER_VIEW);
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { q } = await searchParams;

  const customers = await prisma.user.findMany({
    where: {
      role: { isStaff: false },
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    },
    include: { _count: { select: { orders: true, serviceOrders: true, applications: true, enrollments: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title={d.admin.customers} description={bn ? "গ্রাহক তালিকা ও কার্যক্রমের সারসংক্ষেপ।" : "Customer list and activity summary."} />
      <form action="/admin/customers" method="get" className="mb-4 flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder={bn ? "নাম, ইমেইল বা ফোন" : "Name, email or phone"} className="input max-w-sm" />
        <button type="submit" className="btn btn-secondary btn-sm">{d.common.search}</button>
      </form>

      {customers.length === 0 ? (
        <EmptyState title={d.common.noResults} body={d.empty.body} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>{bn ? "নাম" : "Name"}</th><th>{d.auth.email}</th><th>{d.auth.phone}</th><th>{bn ? "অর্ডার" : "Orders"}</th><th>{bn ? "আবেদন" : "Apps"}</th><th>{bn ? "কোর্স" : "Courses"}</th><th>{bn ? "যোগদান" : "Joined"}</th><th>{d.common.status}</th></tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-medium">{customer.name}</td>
                  <td className="text-muted">{customer.email}</td>
                  <td className="text-muted">{customer.phone ?? "—"}</td>
                  <td>{customer._count.orders + customer._count.serviceOrders}</td>
                  <td>{customer._count.applications}</td>
                  <td>{customer._count.enrollments}</td>
                  <td className="text-muted">{formatDate(customer.createdAt, locale)}</td>
                  <td><StatusBadge status={customer.status} locale={locale} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
