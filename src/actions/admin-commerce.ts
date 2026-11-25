"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { notify } from "@/actions/notify";
import { saveUpload } from "@/lib/storage";
import { newPurchaseRef } from "@/lib/ids";
import { toBool, toInt, toStr } from "@/lib/utils";
import type { OrderStatus, ServiceOrderStatus, StockMovementType } from "@prisma/client";

const SERVICE_STATUSES = [
  "PENDING",
  "PAYMENT_PENDING",
  "PROCESSING",
  "NEED_MORE_INFO",
  "IN_REVIEW",
  "COMPLETED",
  "DELIVERED",
  "CANCELLED",
] as const;

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;

function isServiceStatus(value: string): value is ServiceOrderStatus {
  return (SERVICE_STATUSES as readonly string[]).includes(value);
}

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export async function updateShopOrderStatus(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.ORDER_MANAGE);
  const orderId = toStr(formData.get("orderId"));
  const status = toStr(formData.get("status"));
  if (!isOrderStatus(status)) redirect(`/admin/orders/${orderId}?flash=invalid_input`);

  const order = await prisma.order.update({ where: { id: orderId }, data: { status } });
  await notify({
    userId: order.customerId,
    title: `Order ${order.orderNo} updated`,
    body: `Your order status is now ${status.replaceAll("_", " ").toLowerCase()}.`,
    link: `/account/orders/${order.id}`,
  });
  await audit({ userId: staff.id, action: "admin.order.status", entity: "Order", entityId: orderId, meta: { status } });
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?flash=updated`);
}

export async function verifyPayment(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.PAYMENT_VERIFY);
  const paymentId = toStr(formData.get("paymentId"));
  const decision = toStr(formData.get("decision"));
  const note = toStr(formData.get("note"));
  const returnTo = toStr(formData.get("returnTo")) || "/admin/payments";

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) redirect(`${returnTo}?flash=not_found`);

  if (decision === "VERIFY") {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "VERIFIED", verifiedById: staff.id, verifiedAt: new Date(), rejectionNote: null },
    });

    if (payment.orderId) {
      const payments = await prisma.payment.findMany({
        where: { orderId: payment.orderId, status: "VERIFIED" },
        select: { amount: true },
      });
      const order = await prisma.order.findUnique({ where: { id: payment.orderId } });
      const paid = payments.reduce((sum, row) => sum + row.amount, 0);
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: order && paid >= order.total ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID" },
      });
    }

    if (payment.serviceOrderId) {
      const order = await prisma.serviceOrder.findUnique({ where: { id: payment.serviceOrderId } });
      if (order) {
        await prisma.serviceOrder.update({
          where: { id: order.id },
          data: {
            status: "PROCESSING",
            history: { create: { fromStatus: order.status, toStatus: "PROCESSING", note: "Payment verified", createdById: staff.id } },
          },
        });
      }
    }

    if (payment.applicationId) {
      const application = await prisma.application.findUnique({ where: { id: payment.applicationId } });
      if (application) {
        await prisma.application.update({
          where: { id: application.id },
          data: {
            status: "PROCESSING",
            history: { create: { fromStatus: application.status, toStatus: "PROCESSING", note: "Payment verified", createdById: staff.id } },
          },
        });
      }
    }

    if (payment.payerId) {
      await notify({
        userId: payment.payerId,
        title: "Payment verified",
        body: `Your payment of ${payment.amount} BDT (${payment.method}) has been verified.`,
        link: "/account",
      });
    }
  } else {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "REJECTED", verifiedById: staff.id, verifiedAt: new Date(), rejectionNote: note || "Could not verify this transaction" },
    });
    if (payment.payerId) {
      await notify({
        userId: payment.payerId,
        title: "Payment could not be verified",
        body: note || "Please check the transaction ID and submit the payment again.",
        link: "/account",
      });
    }
  }

  await audit({
    userId: staff.id,
    action: `payment.${decision === "VERIFY" ? "verify" : "reject"}`,
    entity: "Payment",
    entityId: paymentId,
    meta: { amount: payment.amount, method: payment.method },
  });
  revalidatePath(returnTo);
  redirect(`${returnTo}?flash=updated`);
}

export async function updateServiceOrder(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.ORDER_MANAGE);
  const orderId = toStr(formData.get("orderId"));
  const status = toStr(formData.get("status"));
  const internalNote = toStr(formData.get("internalNote"));
  const customerNote = toStr(formData.get("customerNote"));
  const assignedToId = toStr(formData.get("assignedToId")) || null;

  const order = await prisma.serviceOrder.findUnique({ where: { id: orderId } });
  if (!order) redirect("/admin/service-orders?flash=not_found");

  const nextStatus = isServiceStatus(status) ? status : order.status;

  await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      internalNote: internalNote || order.internalNote,
      customerNote: customerNote || null,
      assignedToId,
      history:
        nextStatus !== order.status
          ? { create: { fromStatus: order.status, toStatus: nextStatus, note: customerNote || internalNote || null, createdById: staff.id } }
          : undefined,
    },
  });

  await notify({
    userId: order.customerId,
    title: `Order ${order.orderNo} updated`,
    body: customerNote || `Status: ${nextStatus.replaceAll("_", " ").toLowerCase()}`,
    link: `/account/service-orders/${order.id}`,
  });
  await audit({ userId: staff.id, action: "admin.service_order.update", entity: "ServiceOrder", entityId: orderId, meta: { status: nextStatus } });
  revalidatePath(`/admin/service-orders/${orderId}`);
  redirect(`/admin/service-orders/${orderId}?flash=updated`);
}

export async function uploadDeliverable(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.ORDER_MANAGE);
  const orderId = toStr(formData.get("orderId"));
  const order = await prisma.serviceOrder.findUnique({ where: { id: orderId } });
  if (!order) redirect("/admin/service-orders?flash=not_found");

  let uploaded = 0;
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("file:") || !(value instanceof File) || value.size === 0) continue;
    const stored = await saveUpload(value, staff.id);
    await prisma.orderFile.create({
      data: { serviceOrderId: orderId, fileId: stored.id, kind: "DELIVERABLE", label: key.slice(5) || stored.originalName },
    });
    uploaded += 1;
  }

  if (uploaded === 0) redirect(`/admin/service-orders/${orderId}?flash=invalid_input`);

  await notify({
    userId: order.customerId,
    title: "Your files are ready",
    body: `${uploaded} completed file(s) uploaded for order ${order.orderNo}.`,
    link: `/account/service-orders/${order.id}`,
  });
  await audit({ userId: staff.id, action: "admin.service_order.deliverable", entity: "ServiceOrder", entityId: orderId });
  revalidatePath(`/admin/service-orders/${orderId}`);
  redirect(`/admin/service-orders/${orderId}?flash=saved`);
}

export async function updateApplicationStatus(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.APPLICATION_MANAGE);
  const applicationId = toStr(formData.get("applicationId"));
  const status = toStr(formData.get("status"));
  const note = toStr(formData.get("note"));
  const internalNote = toStr(formData.get("internalNote"));
  const assignedToId = toStr(formData.get("assignedToId")) || null;

  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) redirect("/admin/applications?flash=not_found");

  const nextStatus = isServiceStatus(status) ? status : application.status;

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: nextStatus,
      internalNote: internalNote || application.internalNote,
      assignedToId,
      completedAt: nextStatus === "COMPLETED" ? new Date() : application.completedAt,
      history:
        nextStatus !== application.status
          ? { create: { fromStatus: application.status, toStatus: nextStatus, note: note || internalNote || null, createdById: staff.id } }
          : undefined,
    },
  });

  await notify({
    userId: application.customerId,
    title: `Application ${application.trackingId} updated`,
    body: note || `Status: ${nextStatus.replaceAll("_", " ").toLowerCase()}`,
    link: `/account/applications/${application.id}`,
  });
  await audit({ userId: staff.id, action: "admin.application.update", entity: "Application", entityId: applicationId, meta: { status: nextStatus } });
  revalidatePath(`/admin/applications/${applicationId}`);
  redirect(`/admin/applications/${applicationId}?flash=updated`);
}

export async function saveProduct(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.PRODUCT_MANAGE);
  const id = toStr(formData.get("id"));
  const sku = toStr(formData.get("sku"));
  const slug = toStr(formData.get("slug"));
  if (!sku || !slug) redirect("/admin/products?flash=invalid_input");

  const data = {
    sku,
    slug,
    categoryId: toStr(formData.get("categoryId")),
    nameBn: toStr(formData.get("nameBn")),
    nameEn: toStr(formData.get("nameEn")),
    descriptionBn: toStr(formData.get("descriptionBn")),
    descriptionEn: toStr(formData.get("descriptionEn")),
    price: toInt(formData.get("price")),
    comparePrice: toInt(formData.get("comparePrice")) || null,
    stock: toInt(formData.get("stock")),
    lowStockAt: toInt(formData.get("lowStockAt"), 5),
    brand: toStr(formData.get("brand")) || null,
    active: toBool(formData.get("active")),
    featured: toBool(formData.get("featured")),
  };

  if (!data.nameBn || !data.nameEn || !data.categoryId || data.price <= 0) {
    redirect(`/admin/products${id ? `/${id}` : "/new"}?flash=invalid_input`);
  }

  const product = id
    ? await prisma.product.update({ where: { id }, data })
    : await prisma.product.create({ data });

  await audit({ userId: staff.id, action: id ? "admin.product.update" : "admin.product.create", entity: "Product", entityId: product.id });
  revalidatePath("/admin/products");
  redirect("/admin/products?flash=saved");
}

export async function toggleProductActive(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.PRODUCT_MANAGE);
  const id = toStr(formData.get("id"));
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) redirect("/admin/products?flash=not_found");
  await prisma.product.update({ where: { id }, data: { active: !product.active } });
  await audit({ userId: staff.id, action: "admin.product.toggle", entity: "Product", entityId: id, meta: { active: !product.active } });
  revalidatePath("/admin/products");
  redirect("/admin/products?flash=updated");
}

export async function adjustStock(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.INVENTORY_MANAGE);
  const productId = toStr(formData.get("productId"));
  const type = toStr(formData.get("type")) as StockMovementType;
  const quantity = Math.abs(toInt(formData.get("quantity")));
  const reason = toStr(formData.get("reason")) || null;

  if (!productId || quantity <= 0 || !["IN", "OUT", "ADJUSTMENT"].includes(type)) {
    redirect("/admin/inventory?flash=invalid_input");
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) redirect("/admin/inventory?flash=not_found");

  const delta = type === "IN" ? quantity : type === "OUT" ? -quantity : quantity - product.stock;

  await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: { stock: { increment: delta } } }),
    prisma.stockMovement.create({
      data: { productId, type, quantity: type === "ADJUSTMENT" ? Math.abs(delta) : quantity, reason, createdById: staff.id },
    }),
  ]);

  await audit({ userId: staff.id, action: "admin.stock.adjust", entity: "Product", entityId: productId, meta: { type, quantity } });
  revalidatePath("/admin/inventory");
  redirect("/admin/inventory?flash=saved");
}

export async function saveSupplier(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.SUPPLIER_MANAGE);
  const id = toStr(formData.get("id"));
  const data = {
    name: toStr(formData.get("name")),
    contactName: toStr(formData.get("contactName")) || null,
    phone: toStr(formData.get("phone")) || null,
    email: toStr(formData.get("email")) || null,
    address: toStr(formData.get("address")) || null,
  };
  if (!data.name) redirect("/admin/suppliers?flash=invalid_input");

  const supplier = id
    ? await prisma.supplier.update({ where: { id }, data })
    : await prisma.supplier.create({ data });

  await audit({ userId: staff.id, action: id ? "admin.supplier.update" : "admin.supplier.create", entity: "Supplier", entityId: supplier.id });
  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers?flash=saved");
}

export async function createPurchase(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.SUPPLIER_MANAGE);
  const supplierId = toStr(formData.get("supplierId"));
  const productId = toStr(formData.get("productId"));
  const quantity = Math.abs(toInt(formData.get("quantity")));
  const unitCost = toInt(formData.get("unitCost"));
  const note = toStr(formData.get("note")) || null;

  if (!supplierId || !productId || quantity <= 0 || unitCost <= 0) {
    redirect("/admin/suppliers?flash=invalid_input");
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) redirect("/admin/suppliers?flash=not_found");

  const total = quantity * unitCost;

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        refNo: newPurchaseRef(),
        supplierId,
        total,
        note,
        createdById: staff.id,
        items: {
          create: [{ productId, name: product.nameEn, quantity, unitCost, total }],
        },
      },
    });
    await tx.product.update({ where: { id: productId }, data: { stock: { increment: quantity } } });
    await tx.stockMovement.create({
      data: {
        productId,
        type: "IN",
        quantity,
        reason: "Purchase",
        reference: purchase.refNo,
        createdById: staff.id,
      },
    });
  });

  await audit({ userId: staff.id, action: "admin.purchase.create", entity: "Purchase", meta: { supplierId, productId, quantity, total } });
  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers?flash=saved");
}
