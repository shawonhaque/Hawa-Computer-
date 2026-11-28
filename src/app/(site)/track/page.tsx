import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Package, Search, Truck } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { getDict, pick } from "@/lib/dictionaries";
import { formatDateTime, formatTaka, normalisePhone } from "@/lib/utils";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { StatusBadge } from "@/components/ui/badge";
import { StaticTrack } from "@/components/site/static-track";
import { STATIC_MODE } from "@/lib/static-mode";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "bn" ? "অর্ডার ট্র্যাক" : "Track Order" };
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNo?: string; phone?: string }>;
}) {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const { orderNo, phone } = await searchParams;

  type ServiceOrderRow = Prisma.ServiceOrderGetPayload<{
    include: { service: true; customer: { select: { phone: true } }; history: true };
  }>;
  type ApplicationRow = Prisma.ApplicationGetPayload<{
    include: { service: true; customer: { select: { phone: true } }; history: true };
  }>;

  let order: Prisma.OrderGetPayload<{
    include: { items: true; customer: { select: { phone: true } }; payments: true };
  }> | null = null;
  let serviceOrders: ServiceOrderRow[] = [];
  let applications: ApplicationRow[] = [];
  let searched = false;

  if (orderNo && phone) {
    searched = true;
    const cleanPhone = normalisePhone(phone);
    const digits = cleanPhone.replace(/^\+?88/, "");

    const [shopOrder, svc, apps] = await Promise.all([
      prisma.order.findFirst({
        where: { orderNo: { equals: orderNo.trim(), mode: "insensitive" } },
        include: { items: true, customer: { select: { phone: true } }, payments: true },
      }),
      prisma.serviceOrder.findMany({
        where: { orderNo: { equals: orderNo.trim(), mode: "insensitive" } },
        include: { service: true, customer: { select: { phone: true } }, history: { orderBy: { createdAt: "asc" } } },
      }),
      prisma.application.findMany({
        where: { trackingId: { equals: orderNo.trim(), mode: "insensitive" } },
        include: { service: true, customer: { select: { phone: true } }, history: { orderBy: { createdAt: "asc" } } },
      }),
    ]);

    const phoneMatches = (candidate: string | null) => {
      if (!candidate) return false;
      const c = normalisePhone(candidate).replace(/^\+?88/, "");
      return c === digits;
    };

    order = shopOrder && phoneMatches(shopOrder.customer.phone) ? shopOrder : null;
    serviceOrders = svc.filter((row) => phoneMatches(row.customer.phone));
    applications = apps.filter((row) => phoneMatches(row.customer.phone));
  }

  const found = Boolean(order) || serviceOrders.length > 0 || applications.length > 0;

  if (STATIC_MODE) {
    return (
      <>
        <PageHero eyebrow={bn ? "ট্র্যাকিং" : "Tracking"} title={d.order.trackTitle} description={d.order.trackSub} />
        <div className="container-page py-10">
          <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.order.trackTitle }]} />
          <StaticTrack en={!bn} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow={bn ? "ট্র্যাকিং" : "Tracking"} title={d.order.trackTitle} description={d.order.trackSub} />

      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.order.trackTitle }]} />

        <form action="/track" method="get" className="card mx-auto max-w-xl space-y-4 p-5">
          <div>
            <label htmlFor="orderNo" className="label">{d.order.orderNo}</label>
            <input id="orderNo" name="orderNo" defaultValue={orderNo ?? ""} required className="input" placeholder="HC-260101-ABCDE" />
          </div>
          <div>
            <label htmlFor="phone" className="label">{d.auth.phone}</label>
            <input id="phone" name="phone" defaultValue={phone ?? ""} required className="input" type="tel" placeholder="01XXXXXXXXX" />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            <Search size={15} /> {d.order.trackBtn}
          </button>
          <p className="text-center text-[0.7rem] text-muted">
            {bn ? "শুধু অর্ডার আইডি ও নিবন্ধিত মোবাইল নম্বর মিললেই তথ্য দেখা যাবে।" : "Details appear only when the order ID and registered mobile number match."}
          </p>
        </form>

        {searched && !found ? (
          <p className="mx-auto mt-6 max-w-xl rounded-xl border border-danger/25 bg-danger/10 p-3 text-center text-sm text-danger">
            {d.order.notFound}
          </p>
        ) : null}

        {order ? (
          <section className="mx-auto mt-8 max-w-2xl">
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{bn ? "শপ অর্ডার" : "Shop order"}</p>
                  <p className="text-lg font-bold">{order.orderNo}</p>
                  <p className="text-xs text-muted">{formatDateTime(order.createdAt, locale)}</p>
                </div>
                <StatusBadge status={order.status} locale={locale} />
              </div>
              <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span className="text-muted">{item.name} × {item.quantity}</span>
                    <span className="font-medium">{formatTaka(item.total, locale)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-semibold">
                <span>{d.common.total}</span>
                <span className="text-royal">{formatTaka(order.total, locale)}</span>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted">
                <Truck size={14} /> {bn ? "ডেলিভারি:" : "Delivery:"} {order.address}, {order.city}
              </p>
            </div>
          </section>
        ) : null}

        {serviceOrders.map((row) => (
          <section key={row.id} className="mx-auto mt-4 max-w-2xl">
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{bn ? "সেবা অর্ডার" : "Service order"}</p>
                  <p className="text-lg font-bold">{row.orderNo}</p>
                  <p className="text-sm">{pick<string>(row.service as never, "name", locale)}</p>
                </div>
                <StatusBadge status={row.status} locale={locale} />
              </div>
              <ol className="mt-4 space-y-3 border-t border-line pt-4">
                {row.history.map((event) => (
                  <li key={event.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-royal" />
                    <div>
                      <p className="font-medium">{event.toStatus.replaceAll("_", " ")}</p>
                      <p className="text-xs text-muted">{formatDateTime(event.createdAt, locale)}{event.note ? ` · ${event.note}` : ""}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}

        {applications.map((row) => (
          <section key={row.id} className="mx-auto mt-4 max-w-2xl">
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{bn ? "আবেদন" : "Application"}</p>
                  <p className="text-lg font-bold">{row.trackingId}</p>
                  <p className="text-sm">{pick<string>(row.service as never, "name", locale)}</p>
                </div>
                <StatusBadge status={row.status} locale={locale} />
              </div>
              <ol className="mt-4 space-y-3 border-t border-line pt-4">
                {row.history.map((event) => (
                  <li key={event.id} className="flex items-start gap-2 text-sm">
                    <Package size={15} className="mt-0.5 shrink-0 text-royal" />
                    <div>
                      <p className="font-medium">{event.toStatus.replaceAll("_", " ")}</p>
                      <p className="text-xs text-muted">{formatDateTime(event.createdAt, locale)}{event.note ? ` · ${event.note}` : ""}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}

        <p className="mt-8 text-center text-xs text-muted">
          {bn ? "আরও বিস্তারিত দেখতে" : "For full details"}{" "}
          <Link href="/login" className="font-semibold text-royal">{d.common.login}</Link>
        </p>
      </div>
    </>
  );
}
