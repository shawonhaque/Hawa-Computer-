import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/permissions";

function csv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null || cell === undefined ? "" : String(cell);
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !user.role.isStaff || !can(user, PERMISSIONS.REPORT_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "orders";
  const from = new Date(url.searchParams.get("from") ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
  const to = new Date(url.searchParams.get("to") ?? new Date().toISOString());

  let body = "";
  if (type === "payments") {
    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { payer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    body = csv([
      ["Reference", "Date", "Method", "Amount", "Status", "Payer", "TrxID"],
      ...payments.map((p) => [p.reference, p.createdAt.toISOString(), p.method, p.amount, p.status, p.payer?.name ?? "", p.trxId ?? ""]),
    ]);
  } else if (type === "expenses") {
    const expenses = await prisma.expense.findMany({ where: { spentAt: { gte: from, lte: to } }, orderBy: { spentAt: "desc" } });
    body = csv([
      ["Date", "Category", "Amount", "Note"],
      ...expenses.map((e) => [e.spentAt.toISOString().slice(0, 10), e.category, e.amount, e.note ?? ""]),
    ]);
  } else {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { customer: { select: { name: true } }, items: true },
      orderBy: { createdAt: "desc" },
    });
    body = csv([
      ["Order", "Date", "Customer", "Items", "Subtotal", "Delivery", "Discount", "Total", "Status", "Payment"],
      ...orders.map((o) => [
        o.orderNo,
        o.createdAt.toISOString(),
        o.customer.name,
        o.items.reduce((sum, i) => sum + i.quantity, 0),
        o.subtotal,
        o.deliveryFee,
        o.discount,
        o.total,
        o.status,
        o.paymentStatus,
      ]),
    ]);
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${from.toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
