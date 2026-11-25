"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/auth";
import { newInvoiceNo, newOrderNo, newPaymentRef } from "@/lib/ids";
import { saveUpload } from "@/lib/storage";
import { checkoutSchema, paymentSchema, serviceOrderSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { getSettings } from "@/lib/settings";
import { toInt, toStr } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/actions/notify";

function parseDetails(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value ?? "{}"));
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export async function createServiceOrder(formData: FormData) {
  const slug = toStr(formData.get("slug"));
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/services/${slug}`)}`);

  const parsed = serviceOrderSchema.safeParse({
    serviceId: formData.get("serviceId"),
    quantity: formData.get("quantity"),
    instructions: formData.get("instructions"),
    deliveryMethod: formData.get("deliveryMethod"),
    deliveryAddress: formData.get("deliveryAddress"),
    details: parseDetails(formData.get("details")),
  });

  if (!parsed.success) redirect(`/services/${slug}?flash=invalid_input`);

  const service = await prisma.service.findUnique({ where: { id: parsed.data.serviceId } });
  if (!service || !service.active) redirect("/services?flash=not_found");

  if (parsed.data.deliveryMethod === "DELIVERY" && !parsed.data.deliveryAddress) {
    redirect(`/services/${slug}?flash=invalid_input&detail=address`);
  }

  const total = service.price * parsed.data.quantity;

  const order = await prisma.serviceOrder.create({
    data: {
      orderNo: newOrderNo(),
      customerId: user.id,
      serviceId: service.id,
      quantity: parsed.data.quantity,
      unitPrice: service.price,
      total,
      details: parsed.data.details,
      instructions: parsed.data.instructions || null,
      deliveryMethod: parsed.data.deliveryMethod,
      deliveryAddress: parsed.data.deliveryAddress || null,
      status: "PENDING",
      history: { create: { toStatus: "PENDING", note: "Order created" } },
    },
  });

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  for (const file of files.slice(0, 8)) {
    try {
      const stored = await saveUpload(file, user.id);
      await prisma.orderFile.create({
        data: { serviceOrderId: order.id, fileId: stored.id, kind: "CUSTOMER_UPLOAD", label: stored.originalName },
      });
    } catch {
      // A single rejected file should not lose the order; the customer can re-upload.
    }
  }

  await notify({
    userId: user.id,
    title: "Order received",
    body: `Your order ${order.orderNo} for ${service.nameEn} has been received.`,
    link: `/account/service-orders/${order.id}`,
  });

  await audit({ userId: user.id, action: "service_order.create", entity: "ServiceOrder", entityId: order.id, meta: { total } });
  revalidatePath("/account");
  redirect(`/account/service-orders/${order.id}?flash=order_placed`);
}

export async function createShopOrder(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=%2Fcheckout");

  let items: { productId: string; quantity: number }[] = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    redirect("/cart?flash=invalid_input");
  }

  const parsed = checkoutSchema.safeParse({
    receiverName: formData.get("receiverName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    zone: formData.get("zone"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes"),
    coupon: formData.get("coupon"),
    items,
  });

  if (!parsed.success) redirect("/checkout?flash=invalid_input");

  const input = parsed.data;
  const settings = await getSettings();
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, active: true } });
  if (products.length !== productIds.length) redirect("/cart?flash=not_found");

  let subtotal = 0;
  const lines = input.items.map((line) => {
    const product = products.find((p) => p.id === line.productId)!;
    if (line.quantity > product.stock) redirect(`/cart?flash=invalid_input&detail=${encodeURIComponent(product.nameEn)}`);
    const total = product.price * line.quantity;
    subtotal += total;
    return {
      productId: product.id,
      name: product.nameEn,
      sku: product.sku,
      quantity: line.quantity,
      unitPrice: product.price,
      total,
    };
  });

  let discount = 0;
  let couponCode: string | null = null;
  if (input.coupon) {
    const coupon = await prisma.coupon.findUnique({ where: { code: input.coupon.toUpperCase() } });
    const usable =
      coupon &&
      coupon.active &&
      subtotal >= coupon.minOrder &&
      (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
      (coupon.maxUses === null || coupon.usedCount < coupon.maxUses);
    if (!usable) redirect("/checkout?flash=coupon_invalid");
    discount = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal);
    couponCode = coupon.code;
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  }

  const baseDelivery = input.zone === "INSIDE" ? settings.deliveryInside : settings.deliveryOutside;
  const deliveryFee = subtotal - discount >= settings.freeDeliveryAbove ? 0 : baseDelivery;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNo: newOrderNo(),
        customerId: user.id,
        subtotal,
        deliveryFee,
        discount,
        total,
        couponCode,
        receiverName: input.receiverName,
        phone: input.phone,
        address: input.address,
        city: input.city,
        notes: input.notes || null,
        items: { create: lines },
        invoice: {
          create: { number: newInvoiceNo(), subtotal, deliveryFee, discount, total },
        },
      },
    });

    for (const line of lines) {
      await tx.product.update({ where: { id: line.productId }, data: { stock: { decrement: line.quantity } } });
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          type: "OUT",
          quantity: line.quantity,
          reason: "Online order",
          reference: created.orderNo,
          createdById: user.id,
        },
      });
    }

    if (input.paymentMethod !== "COD" && input.paymentMethod !== "CASH") {
      await tx.payment.create({
        data: {
          reference: newPaymentRef(),
          orderId: created.id,
          payerId: user.id,
          method: input.paymentMethod,
          amount: total,
          status: "PENDING",
        },
      });
    }

    return created;
  });

  await notify({
    userId: user.id,
    title: "Order confirmed",
    body: `Your order ${order.orderNo} has been placed. Total ${total} BDT.`,
    link: `/account/orders/${order.id}`,
  });
  await audit({ userId: user.id, action: "shop_order.create", entity: "Order", entityId: order.id, meta: { total } });

  revalidatePath("/account/orders");
  redirect(`/account/orders/${order.id}?flash=order_placed`);
}

export async function submitPayment(formData: FormData) {
  const user = await requireUser();
  const returnTo = toStr(formData.get("returnTo")) || "/account";

  if (!rateLimit(`payment:${user.id}`, 10, 600_000).ok) redirect(`${returnTo}?flash=rate_limited`);

  const orderId = toStr(formData.get("orderId")) || null;
  const serviceOrderId = toStr(formData.get("serviceOrderId")) || null;
  const applicationId = toStr(formData.get("applicationId")) || null;

  const parsed = paymentSchema.safeParse({
    method: formData.get("method"),
    amount: formData.get("amount"),
    trxId: formData.get("trxId"),
    payerNumber: formData.get("payerNumber"),
  });
  if (!parsed.success) redirect(`${returnTo}?flash=invalid_input`);

  let expected = 0;
  if (orderId) {
    const order = await prisma.order.findFirst({ where: { id: orderId, customerId: user.id } });
    if (!order) redirect(`${returnTo}?flash=not_found`);
    expected = order.total;
  } else if (serviceOrderId) {
    const order = await prisma.serviceOrder.findFirst({ where: { id: serviceOrderId, customerId: user.id } });
    if (!order) redirect(`${returnTo}?flash=not_found`);
    expected = order.total;
  } else if (applicationId) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, customerId: user.id },
      include: { service: true },
    });
    if (!application) redirect(`${returnTo}?flash=not_found`);
    expected = application.service.price;
  } else {
    redirect(`${returnTo}?flash=not_found`);
  }

  if (parsed.data.amount > expected) redirect(`${returnTo}?flash=invalid_input&detail=amount`);

  let screenshotId: string | null = null;
  const screenshot = formData.get("screenshot");
  if (screenshot instanceof File && screenshot.size > 0) {
    try {
      const stored = await saveUpload(screenshot, user.id);
      screenshotId = stored.id;
    } catch {
      redirect(`${returnTo}?flash=upload_failed`);
    }
  }

  await prisma.payment.create({
    data: {
      reference: newPaymentRef(),
      orderId,
      serviceOrderId,
      applicationId,
      payerId: user.id,
      method: parsed.data.method,
      amount: parsed.data.amount,
      trxId: parsed.data.trxId || null,
      payerNumber: parsed.data.payerNumber || null,
      screenshotId,
      status: "PENDING",
    },
  });

  if (serviceOrderId) {
    await prisma.serviceOrder.update({ where: { id: serviceOrderId }, data: { status: "PAYMENT_PENDING" } });
  }
  if (applicationId) {
    await prisma.application.update({ where: { id: applicationId }, data: { status: "PAYMENT_PENDING" } });
  }

  await audit({
    userId: user.id,
    action: "payment.submit",
    entity: "Payment",
    entityId: orderId ?? serviceOrderId ?? applicationId ?? undefined,
    meta: { method: parsed.data.method, amount: parsed.data.amount },
  });

  revalidatePath(returnTo);
  redirect(`${returnTo}?flash=payment_submitted`);
}

export async function cancelOwnOrder(formData: FormData) {
  const user = await requireUser();
  const orderId = toStr(formData.get("orderId"));
  const order = await prisma.order.findFirst({ where: { id: orderId, customerId: user.id } });
  if (!order) redirect("/account/orders?flash=not_found");
  if (!["PENDING", "CONFIRMED"].includes(order.status)) redirect(`/account/orders/${orderId}?flash=forbidden`);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      if (!item.productId) continue;
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      await tx.stockMovement.create({
        data: { productId: item.productId, type: "IN", quantity: item.quantity, reason: "Order cancelled", reference: order.orderNo },
      });
    }
  });

  await audit({ userId: user.id, action: "shop_order.cancel", entity: "Order", entityId: orderId });
  revalidatePath(`/account/orders/${orderId}`);
  redirect(`/account/orders/${orderId}?flash=updated`);
}

export async function requestRefund(formData: FormData) {
  const user = await requireUser();
  const orderId = toStr(formData.get("orderId"));
  const reason = toStr(formData.get("reason"));
  const amount = toInt(formData.get("amount"));
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: user.id },
    include: { payments: { where: { status: "VERIFIED" } } },
  });
  if (!order || order.payments.length === 0) redirect(`/account/orders/${orderId}?flash=not_found`);
  const payment = order.payments[0];
  if (amount <= 0 || amount > payment.amount) redirect(`/account/orders/${orderId}?flash=invalid_input`);

  await prisma.refund.create({
    data: { paymentId: payment.id, orderId: order.id, amount, reason: reason || "Customer request", status: "PENDING" },
  });
  await audit({ userId: user.id, action: "refund.request", entity: "Order", entityId: order.id, meta: { amount } });
  redirect(`/account/orders/${orderId}?flash=saved`);
}
