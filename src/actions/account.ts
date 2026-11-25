"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { newMemberNo, newTicketNo } from "@/lib/ids";
import { profileSchema, reviewSchema, ticketSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { notify, notifyStaff } from "@/actions/notify";
import { toStr } from "@/lib/utils";

export async function updateProfile(formData: FormData) {
  const user = await requireUser("/account/profile");
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    district: formData.get("district"),
    postcode: formData.get("postcode"),
  });
  if (!parsed.success) redirect("/account/profile?flash=invalid_input");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      profile: {
        upsert: {
          update: {
            address: parsed.data.address || null,
            city: parsed.data.city || null,
            district: parsed.data.district || null,
            postcode: parsed.data.postcode || null,
          },
          create: {
            address: parsed.data.address || null,
            city: parsed.data.city || null,
            district: parsed.data.district || null,
            postcode: parsed.data.postcode || null,
          },
        },
      },
    },
  });
  await audit({ userId: user.id, action: "profile.update", entity: "User", entityId: user.id });
  revalidatePath("/account/profile");
  redirect("/account/profile?flash=saved");
}

export async function changePassword(formData: FormData) {
  const user = await requireUser("/account/profile");
  const current = toStr(formData.get("currentPassword"));
  const next = toStr(formData.get("newPassword"));
  const confirm = toStr(formData.get("confirmPassword"));

  if (next.length < 8 || next !== confirm) redirect("/account/profile?flash=invalid_input");

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await verifyPassword(current, record.passwordHash))) {
    redirect("/account/profile?flash=invalid_credentials");
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await audit({ userId: user.id, action: "password.change", entity: "User", entityId: user.id });
  redirect("/login?flash=updated");
}

export async function requestAccountDeletion(formData: FormData) {
  const user = await requireUser("/account/profile");
  const reason = toStr(formData.get("reason"));
  await prisma.supportTicket.create({
    data: {
      ticketNo: newTicketNo(),
      userId: user.id,
      subject: "Account deletion request",
      priority: "HIGH",
      status: "OPEN",
      messages: {
        create: {
          authorId: user.id,
          body: reason || "I would like my account and personal data deleted.",
        },
      },
    },
  });
  await notifyStaff({
    title: "Account deletion request",
    body: `${user.name} (${user.email}) requested account deletion.`,
    link: "/admin/support",
  });
  await audit({ userId: user.id, action: "account.deletion_request", entity: "User", entityId: user.id });
  redirect("/account/profile?flash=saved");
}

export async function toggleWishlist(formData: FormData) {
  const user = await requireUser("/shop");
  const productId = toStr(formData.get("productId"));
  const returnTo = toStr(formData.get("returnTo")) || "/shop";
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  }
  revalidatePath(returnTo);
  redirect(`${returnTo}?flash=saved`);
}

export async function submitReview(formData: FormData) {
  const user = await requireUser("/shop");
  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  const slug = toStr(formData.get("slug"));
  if (!parsed.success) redirect(`/shop/${slug}?flash=invalid_input`);

  await prisma.review.upsert({
    where: { productId_userId: { productId: parsed.data.productId, userId: user.id } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment || null, approved: false },
    create: {
      productId: parsed.data.productId,
      userId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });
  await audit({ userId: user.id, action: "review.submit", entity: "Product", entityId: parsed.data.productId });
  redirect(`/shop/${slug}?flash=review_submitted`);
}

export async function enrollCourse(formData: FormData) {
  const user = await requireUser("/training");
  const courseId = toStr(formData.get("courseId"));
  const batchId = toStr(formData.get("batchId")) || null;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.active) redirect("/training?flash=not_found");

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId } },
  });
  if (existing) redirect(`/account/courses?flash=already_enrolled`);

  if (batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId }, include: { _count: { select: { enrollments: true } } } });
    if (!batch || batch._count.enrollments >= batch.capacity) {
      redirect(`/training/${course.slug}?flash=invalid_input&detail=batch_full`);
    }
  }

  const enrollment = await prisma.enrollment.create({
    data: { studentId: user.id, courseId, batchId, status: "PENDING" },
  });
  await notify({
    userId: user.id,
    title: "Course admission submitted",
    body: `Your admission request for ${course.titleEn} is pending approval. Course fee ${course.fee} BDT.`,
    link: "/account/courses",
  });
  await notifyStaff({
    title: "New training admission",
    body: `${user.name} applied for ${course.titleEn}`,
    link: "/admin/students",
  });
  await audit({ userId: user.id, action: "enrollment.create", entity: "Enrollment", entityId: enrollment.id });

  revalidatePath("/account/courses");
  redirect("/account/courses?flash=saved");
}

export async function requestLibraryMembership() {
  const user = await requireUser("/library");
  const existing = await prisma.libraryMember.findUnique({ where: { userId: user.id } });
  if (existing) redirect("/account/library?flash=saved");

  const member = await prisma.libraryMember.create({
    data: {
      memberNo: newMemberNo(),
      userId: user.id,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 365 * 864e5),
    },
  });
  await notify({
    userId: user.id,
    title: "Library membership active",
    body: `Your membership number is ${member.memberNo}. Visit the library to borrow books.`,
    link: "/account/library",
  });
  await audit({ userId: user.id, action: "library.membership.create", entity: "LibraryMember", entityId: member.id });
  revalidatePath("/account/library");
  redirect("/account/library?flash=saved");
}

export async function createTicket(formData: FormData) {
  const user = await requireUser("/account/tickets");
  const parsed = ticketSchema.safeParse({
    subject: formData.get("subject"),
    message: formData.get("message"),
    priority: formData.get("priority") || "NORMAL",
  });
  if (!parsed.success) redirect("/account/tickets?flash=invalid_input");

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNo: newTicketNo(),
      userId: user.id,
      subject: parsed.data.subject,
      priority: parsed.data.priority,
      messages: { create: { authorId: user.id, body: parsed.data.message } },
    },
  });
  await notifyStaff({ title: "New support ticket", body: ticket.subject, link: `/admin/support/${ticket.id}` });
  await audit({ userId: user.id, action: "ticket.create", entity: "SupportTicket", entityId: ticket.id });
  revalidatePath("/account/tickets");
  redirect(`/account/tickets/${ticket.id}?flash=ticket_created`);
}

export async function replyToTicket(formData: FormData) {
  const user = await requireUser("/account/tickets");
  const ticketId = toStr(formData.get("ticketId"));
  const body = toStr(formData.get("body"));
  if (!body) redirect(`/account/tickets/${ticketId}?flash=invalid_input`);

  const ticket = await prisma.supportTicket.findFirst({ where: { id: ticketId, userId: user.id } });
  if (!ticket) redirect("/account/tickets?flash=not_found");
  if (ticket.status === "CLOSED") redirect(`/account/tickets/${ticketId}?flash=forbidden`);

  await prisma.ticketMessage.create({ data: { ticketId, authorId: user.id, body } });
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "OPEN" } });
  await notifyStaff({ title: "Ticket reply", body: ticket.subject, link: `/admin/support/${ticketId}` });
  revalidatePath(`/account/tickets/${ticketId}`);
  redirect(`/account/tickets/${ticketId}?flash=message_sent`);
}

export async function markNotificationsRead() {
  const user = await requireUser("/account/notifications");
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/account/notifications");
  redirect("/account/notifications?flash=updated");
}

export async function openNotification(formData: FormData) {
  const user = await requireUser("/account/notifications");
  const id = toStr(formData.get("id"));
  const notification = await prisma.notification.findFirst({ where: { id, userId: user.id } });
  if (!notification) redirect("/account/notifications?flash=not_found");
  await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  redirect(notification.link ?? "/account/notifications");
}

export async function requestBookBorrow(formData: FormData) {
  const user = await requireUser("/library");
  const bookId = toStr(formData.get("bookId"));
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) redirect("/library?flash=not_found");

  const member = await prisma.libraryMember.findUnique({ where: { userId: user.id } });
  if (!member || member.status !== "ACTIVE") {
    redirect(`/library/${book.slug}?flash=forbidden`);
  }
  if (book.copiesAvailable <= 0) {
    redirect(`/library/${book.slug}?flash=invalid_input&detail=unavailable`);
  }

  const openRequest = await prisma.supportTicket.findFirst({
    where: { userId: user.id, status: { in: ["OPEN", "PENDING"] }, subject: { contains: book.titleEn } },
  });
  if (openRequest) redirect(`/library/${book.slug}?flash=saved`);

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNo: newTicketNo(),
      userId: user.id,
      subject: `Book borrow request — ${book.titleEn}`,
      priority: "NORMAL",
      messages: {
        create: {
          authorId: user.id,
          body: `Membership: ${member.memberNo}\nBook: ${book.titleEn} (${book.isbn ?? "no ISBN"})\nI would like to borrow this book.`,
        },
      },
    },
  });
  await notifyStaff({ title: "Book borrow request", body: `${user.name} — ${book.titleEn}`, link: `/admin/support/${ticket.id}` });
  await audit({ userId: user.id, action: "library.borrow_request", entity: "Book", entityId: book.id });
  revalidatePath(`/library/${book.slug}`);
  redirect(`/library/${book.slug}?flash=saved`);
}
