"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff, hashPassword } from "@/lib/auth";
import { PERMISSIONS, ALL_PERMISSIONS, type Permission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { notify } from "@/actions/notify";
import { newCertificateNo } from "@/lib/ids";
import { saveSettings } from "@/lib/settings";
import { toBool, toInt, toStr } from "@/lib/utils";
import type { EnrollmentStatus, Prisma } from "@prisma/client";

export async function saveBook(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.LIBRARY_MANAGE);
  const id = toStr(formData.get("id"));
  const titleBn = toStr(formData.get("titleBn"));
  const titleEn = toStr(formData.get("titleEn"));
  const author = toStr(formData.get("author"));
  if (!titleBn || !titleEn || !author) redirect("/admin/library?flash=invalid_input");

  const copiesTotal = Math.max(1, toInt(formData.get("copiesTotal"), 1));
  const existing = id ? await prisma.book.findUnique({ where: { id } }) : null;
  const issuedOut = existing ? Math.max(0, existing.copiesTotal - existing.copiesAvailable) : 0;

  const data = {
    categoryId: toStr(formData.get("categoryId")),
    titleBn,
    titleEn,
    author,
    isbn: toStr(formData.get("isbn")) || null,
    publisher: toStr(formData.get("publisher")) || null,
    publishedYear: toInt(formData.get("publishedYear")) || null,
    descriptionBn: toStr(formData.get("descriptionBn")),
    descriptionEn: toStr(formData.get("descriptionEn")),
    shelf: toStr(formData.get("shelf")) || null,
    copiesTotal,
    copiesAvailable: Math.max(0, copiesTotal - issuedOut),
    slug: toStr(formData.get("slug")),
  };

  const book = id
    ? await prisma.book.update({ where: { id }, data })
    : await prisma.book.create({ data });

  await audit({ userId: staff.id, action: id ? "admin.book.update" : "admin.book.create", entity: "Book", entityId: book.id });
  revalidatePath("/admin/library");
  redirect("/admin/library?flash=saved");
}

export async function issueBook(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.LIBRARY_MANAGE);
  const bookId = toStr(formData.get("bookId"));
  const memberNo = toStr(formData.get("memberNo"));
  const dueAt = new Date(toStr(formData.get("dueAt")) || Date.now() + 14 * 864e5);

  const [book, member] = await Promise.all([
    prisma.book.findUnique({ where: { id: bookId } }),
    prisma.libraryMember.findUnique({ where: { memberNo }, include: { user: true } }),
  ]);
  if (!book || !member) redirect("/admin/library?flash=not_found");
  if (book.copiesAvailable <= 0) redirect("/admin/library?flash=invalid_input");

  await prisma.$transaction([
    prisma.bookIssue.create({ data: { bookId, memberId: member.id, dueAt, status: "ISSUED" } }),
    prisma.book.update({ where: { id: bookId }, data: { copiesAvailable: { decrement: 1 } } }),
  ]);

  await notify({
    userId: member.userId,
    title: "Book issued",
    body: `${book.titleEn} has been issued to you. Please return by ${dueAt.toDateString()}.`,
    link: "/account/library",
  });
  await audit({ userId: staff.id, action: "admin.library.issue", entity: "Book", entityId: bookId, meta: { memberNo } });
  revalidatePath("/admin/library");
  redirect("/admin/library?flash=saved");
}

export async function returnBook(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.LIBRARY_MANAGE);
  const issueId = toStr(formData.get("issueId"));
  const issue = await prisma.bookIssue.findUnique({ where: { id: issueId }, include: { book: true, member: true } });
  if (!issue || issue.returnedAt) redirect("/admin/library?flash=not_found");

  const now = new Date();
  const daysLate = Math.max(0, Math.ceil((now.getTime() - issue.dueAt.getTime()) / 864e5));
  const fine = daysLate * 5;

  await prisma.$transaction([
    prisma.bookIssue.update({
      where: { id: issueId },
      data: { returnedAt: now, status: "RETURNED", fine },
    }),
    prisma.book.update({ where: { id: issue.bookId }, data: { copiesAvailable: { increment: 1 } } }),
  ]);

  await notify({
    userId: issue.member.userId,
    title: "Book returned",
    body: `${issue.book.titleEn} returned.${fine > 0 ? ` Fine due: ${fine} BDT.` : ""}`,
    link: "/account/library",
  });
  await audit({ userId: staff.id, action: "admin.library.return", entity: "BookIssue", entityId: issueId, meta: { fine } });
  revalidatePath("/admin/library");
  redirect("/admin/library?flash=updated");
}

export async function saveCourse(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.COURSE_MANAGE);
  const id = toStr(formData.get("id"));
  const titleBn = toStr(formData.get("titleBn"));
  const titleEn = toStr(formData.get("titleEn"));
  if (!titleBn || !titleEn) redirect("/admin/courses?flash=invalid_input");

  const syllabus = toStr(formData.get("syllabus"))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const data = {
    slug: toStr(formData.get("slug")),
    titleBn,
    titleEn,
    summaryBn: toStr(formData.get("summaryBn")),
    summaryEn: toStr(formData.get("summaryEn")),
    descriptionBn: toStr(formData.get("descriptionBn")),
    descriptionEn: toStr(formData.get("descriptionEn")),
    durationWeeks: Math.max(1, toInt(formData.get("durationWeeks"), 4)),
    fee: toInt(formData.get("fee")),
    level: toStr(formData.get("level")) || "BEGINNER",
    syllabus: syllabus as Prisma.InputJsonValue,
    active: toBool(formData.get("active")),
    featured: toBool(formData.get("featured")),
  };

  const course = id ? await prisma.course.update({ where: { id }, data }) : await prisma.course.create({ data });
  await audit({ userId: staff.id, action: id ? "admin.course.update" : "admin.course.create", entity: "Course", entityId: course.id });
  revalidatePath("/admin/courses");
  redirect("/admin/courses?flash=saved");
}

export async function saveBatch(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.COURSE_MANAGE);
  const id = toStr(formData.get("id"));
  const data = {
    courseId: toStr(formData.get("courseId")),
    code: toStr(formData.get("code")),
    startDate: new Date(toStr(formData.get("startDate")) || Date.now()),
    endDate: toStr(formData.get("endDate")) ? new Date(toStr(formData.get("endDate"))) : null,
    scheduleBn: toStr(formData.get("scheduleBn")),
    scheduleEn: toStr(formData.get("scheduleEn")),
    capacity: Math.max(1, toInt(formData.get("capacity"), 20)),
    instructorId: toStr(formData.get("instructorId")) || null,
    active: toBool(formData.get("active")),
  };
  if (!data.courseId || !data.code) redirect("/admin/batches?flash=invalid_input");

  const batch = id ? await prisma.batch.update({ where: { id }, data }) : await prisma.batch.create({ data });
  await audit({ userId: staff.id, action: id ? "admin.batch.update" : "admin.batch.create", entity: "Batch", entityId: batch.id });
  revalidatePath("/admin/batches");
  redirect("/admin/batches?flash=saved");
}

export async function updateEnrollment(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.ENROLLMENT_MANAGE);
  const enrollmentId = toStr(formData.get("enrollmentId"));
  const status = toStr(formData.get("status")) as EnrollmentStatus;
  const feePaid = toInt(formData.get("feePaid"));
  const progress = Math.min(100, Math.max(0, toInt(formData.get("progress"))));

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) redirect("/admin/students?flash=not_found");

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status,
      feePaid,
      progress,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  await notify({
    userId: enrollment.studentId,
    title: "Enrolment updated",
    body: `Status: ${status.toLowerCase()} · Progress: ${progress}%`,
    link: "/account/courses",
  });
  await audit({ userId: staff.id, action: "admin.enrollment.update", entity: "Enrollment", entityId: enrollmentId, meta: { status, feePaid, progress } });
  revalidatePath("/admin/students");
  redirect("/admin/students?flash=updated");
}

export async function issueCertificate(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.CERTIFICATE_ISSUE);
  const enrollmentId = toStr(formData.get("enrollmentId"));
  const grade = toStr(formData.get("grade")) || null;
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { certificate: true } });
  if (!enrollment) redirect("/admin/students?flash=not_found");
  if (enrollment.certificate) redirect("/admin/students?flash=saved");

  const certificate = await prisma.certificate.create({
    data: { certNo: newCertificateNo(), enrollmentId, grade },
  });
  await notify({
    userId: enrollment.studentId,
    title: "Certificate issued",
    body: `Your certificate number is ${certificate.certNo}. Verify it at /verify/${certificate.certNo}.`,
    link: `/verify/${certificate.certNo}`,
  });
  await audit({ userId: staff.id, action: "admin.certificate.issue", entity: "Certificate", entityId: certificate.id });
  revalidatePath("/admin/students");
  redirect("/admin/students?flash=saved");
}

export async function markAttendance(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.ATTENDANCE_MANAGE);
  const enrollmentId = toStr(formData.get("enrollmentId"));
  const status = toStr(formData.get("status")) || "PRESENT";
  const date = new Date(toStr(formData.get("date")) || new Date().toISOString().slice(0, 10));

  await prisma.attendance.upsert({
    where: { enrollmentId_date: { enrollmentId, date } },
    update: { status },
    create: { enrollmentId, date, status },
  });
  await audit({ userId: staff.id, action: "admin.attendance.mark", entity: "Enrollment", entityId: enrollmentId, meta: { status } });
  revalidatePath("/admin/students");
  redirect("/admin/students?flash=saved");
}

export async function saveExpense(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.FINANCE_MANAGE);
  const amount = toInt(formData.get("amount"));
  const category = toStr(formData.get("category"));
  if (amount <= 0 || !category) redirect("/admin/expenses?flash=invalid_input");

  await prisma.expense.create({
    data: {
      category,
      amount,
      note: toStr(formData.get("note")) || null,
      spentAt: toStr(formData.get("spentAt")) ? new Date(toStr(formData.get("spentAt"))) : new Date(),
      createdById: staff.id,
    },
  });
  await audit({ userId: staff.id, action: "admin.expense.create", entity: "Expense", meta: { amount, category } });
  revalidatePath("/admin/expenses");
  redirect("/admin/expenses?flash=saved");
}

export async function deleteExpense(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.FINANCE_MANAGE);
  const id = toStr(formData.get("id"));
  await prisma.expense.delete({ where: { id } }).catch(() => null);
  await audit({ userId: staff.id, action: "admin.expense.delete", entity: "Expense", entityId: id });
  revalidatePath("/admin/expenses");
  redirect("/admin/expenses?flash=deleted");
}

export async function decideRefund(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.REFUND_MANAGE);
  const refundId = toStr(formData.get("refundId"));
  const decision = toStr(formData.get("decision"));
  const refund = await prisma.refund.findUnique({ where: { id: refundId }, include: { payment: true } });
  if (!refund) redirect("/admin/refunds?flash=not_found");

  if (decision === "APPROVE") {
    await prisma.$transaction([
      prisma.refund.update({ where: { id: refundId }, data: { status: "APPROVED", processedById: staff.id } }),
      prisma.payment.update({ where: { id: refund.paymentId }, data: { status: "VERIFIED" } }),
      ...(refund.orderId
        ? [prisma.order.update({ where: { id: refund.orderId }, data: { paymentStatus: "REFUNDED" } })]
        : []),
    ]);
    if (refund.payment.payerId) {
      await notify({
        userId: refund.payment.payerId,
        title: "Refund approved",
        body: `Your refund of ${refund.amount} BDT has been approved and will be processed.`,
        link: "/account",
      });
    }
  } else {
    await prisma.refund.update({ where: { id: refundId }, data: { status: "REJECTED", processedById: staff.id } });
  }

  await audit({ userId: staff.id, action: `admin.refund.${decision.toLowerCase()}`, entity: "Refund", entityId: refundId });
  revalidatePath("/admin/refunds");
  redirect("/admin/refunds?flash=updated");
}

export async function saveStaff(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.USER_MANAGE);
  const id = toStr(formData.get("id"));
  const email = toStr(formData.get("email")).toLowerCase();
  const name = toStr(formData.get("name"));
  const roleId = toStr(formData.get("roleId"));
  const designation = toStr(formData.get("designation")) || null;
  const password = toStr(formData.get("password"));
  if (!name || !roleId) redirect("/admin/staff?flash=invalid_input");

  if (id) {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        roleId,
        staff: { upsert: { update: { designation }, create: { designation } } },
      },
    });
  } else {
    if (!email || password.length < 8) redirect("/admin/staff?flash=invalid_input");
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) redirect("/admin/staff?flash=email_exists");
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(password),
        roleId,
        staff: { create: { designation } },
      },
    });
  }

  await audit({ userId: staff.id, action: id ? "admin.staff.update" : "admin.staff.create", entity: "User", entityId: id || undefined });
  revalidatePath("/admin/staff");
  redirect("/admin/staff?flash=saved");
}

export async function updateUserStatus(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.USER_MANAGE);
  const id = toStr(formData.get("id"));
  const status = toStr(formData.get("status"));
  if (!["ACTIVE", "SUSPENDED", "DELETED"].includes(status)) redirect("/admin/staff?flash=invalid_input");
  if (id === staff.id) redirect("/admin/staff?flash=forbidden");

  await prisma.user.update({ where: { id }, data: { status: status as "ACTIVE" | "SUSPENDED" | "DELETED" } });
  if (status !== "ACTIVE") {
    await prisma.session.deleteMany({ where: { userId: id } });
  }
  await audit({ userId: staff.id, action: "admin.user.status", entity: "User", entityId: id, meta: { status } });
  revalidatePath("/admin/staff");
  redirect("/admin/staff?flash=updated");
}

export async function saveRole(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.ROLE_MANAGE);
  const id = toStr(formData.get("id"));
  const permissions = formData.getAll("permissions").map(String).filter((p): p is Permission =>
    (ALL_PERMISSIONS as string[]).includes(p),
  );
  await prisma.role.update({ where: { id }, data: { permissions } });
  await audit({ userId: staff.id, action: "admin.role.update", entity: "Role", entityId: id, meta: { count: permissions.length } });
  revalidatePath("/admin/roles");
  redirect("/admin/roles?flash=saved");
}

export async function savePage(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.CMS_MANAGE);
  const id = toStr(formData.get("id"));
  const data = {
    titleBn: toStr(formData.get("titleBn")),
    titleEn: toStr(formData.get("titleEn")),
    contentBn: toStr(formData.get("contentBn")),
    contentEn: toStr(formData.get("contentEn")),
    published: toBool(formData.get("published")),
  };
  if (id) {
    await prisma.page.update({ where: { id }, data });
  } else {
    const slug = toStr(formData.get("slug"));
    if (!slug) redirect("/admin/content?flash=invalid_input");
    await prisma.page.create({ data: { slug, ...data } });
  }
  await audit({ userId: staff.id, action: "admin.page.save", entity: "Page", entityId: id || undefined });
  revalidatePath("/admin/content");
  redirect("/admin/content?flash=saved");
}

export async function saveFaq(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.CMS_MANAGE);
  const id = toStr(formData.get("id"));
  const data = {
    questionBn: toStr(formData.get("questionBn")),
    questionEn: toStr(formData.get("questionEn")),
    answerBn: toStr(formData.get("answerBn")),
    answerEn: toStr(formData.get("answerEn")),
    sortOrder: toInt(formData.get("sortOrder")),
    active: toBool(formData.get("active")),
  };
  if (!data.questionBn || !data.questionEn) redirect("/admin/content?flash=invalid_input");
  if (id) await prisma.faq.update({ where: { id }, data });
  else await prisma.faq.create({ data });
  await audit({ userId: staff.id, action: "admin.faq.save", entity: "Faq", entityId: id || undefined });
  revalidatePath("/admin/content");
  redirect("/admin/content?flash=saved");
}

export async function moderateTestimonial(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.CMS_MANAGE);
  const id = toStr(formData.get("id"));
  const decision = toStr(formData.get("decision"));
  if (decision === "APPROVE") {
    await prisma.testimonial.update({ where: { id }, data: { approved: true } });
  } else {
    await prisma.testimonial.delete({ where: { id } }).catch(() => null);
  }
  await audit({ userId: staff.id, action: `admin.testimonial.${decision.toLowerCase()}`, entity: "Testimonial", entityId: id });
  revalidatePath("/admin/content");
  redirect("/admin/content?flash=updated");
}

export async function saveService(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.CMS_MANAGE);
  const id = toStr(formData.get("id"));
  const data = {
    categoryId: toStr(formData.get("categoryId")),
    nameBn: toStr(formData.get("nameBn")),
    nameEn: toStr(formData.get("nameEn")),
    summaryBn: toStr(formData.get("summaryBn")),
    summaryEn: toStr(formData.get("summaryEn")),
    descriptionBn: toStr(formData.get("descriptionBn")),
    descriptionEn: toStr(formData.get("descriptionEn")),
    price: toInt(formData.get("price")),
    processingTimeBn: toStr(formData.get("processingTimeBn")),
    processingTimeEn: toStr(formData.get("processingTimeEn")),
    active: toBool(formData.get("active")),
    featured: toBool(formData.get("featured")),
  };
  if (!data.nameBn || !data.nameEn || !data.categoryId) redirect("/admin/services?flash=invalid_input");
  if (id) {
    await prisma.service.update({ where: { id }, data });
  } else {
    const slug = toStr(formData.get("slug"));
    if (!slug) redirect("/admin/services?flash=invalid_input");
    await prisma.service.create({ data: { slug, ...data } });
  }
  await audit({ userId: staff.id, action: "admin.service.save", entity: "Service", entityId: id || undefined });
  revalidatePath("/admin/services");
  redirect("/admin/services?flash=saved");
}

export async function saveSiteSettings(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.SETTINGS_MANAGE);
  await saveSettings({
    businessNameBn: toStr(formData.get("businessNameBn")),
    businessNameEn: toStr(formData.get("businessNameEn")),
    phone: toStr(formData.get("phone")),
    whatsapp: toStr(formData.get("whatsapp")),
    email: toStr(formData.get("email")),
    addressBn: toStr(formData.get("addressBn")),
    addressEn: toStr(formData.get("addressEn")),
    hoursBn: toStr(formData.get("hoursBn")),
    hoursEn: toStr(formData.get("hoursEn")),
    mapEmbedUrl: toStr(formData.get("mapEmbedUrl")),
    facebook: toStr(formData.get("facebook")),
    deliveryInside: toInt(formData.get("deliveryInside")),
    deliveryOutside: toInt(formData.get("deliveryOutside")),
    freeDeliveryAbove: toInt(formData.get("freeDeliveryAbove")),
    paymentNoteBn: toStr(formData.get("paymentNoteBn")),
    paymentNoteEn: toStr(formData.get("paymentNoteEn")),
  });
  await audit({ userId: staff.id, action: "admin.settings.save", entity: "SiteSetting" });
  revalidatePath("/", "layout");
  redirect("/admin/settings?flash=saved");
}

export async function adminReplyTicket(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.SUPPORT_MANAGE);
  const ticketId = toStr(formData.get("ticketId"));
  const body = toStr(formData.get("body"));
  if (!body) redirect(`/admin/support/${ticketId}?flash=invalid_input`);

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) redirect("/admin/support?flash=not_found");

  await prisma.ticketMessage.create({ data: { ticketId, authorId: staff.id, body, isStaff: true } });
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "PENDING" } });
  await notify({ userId: ticket.userId, title: "Support replied", body: body.slice(0, 140), link: `/account/tickets/${ticketId}` });
  await audit({ userId: staff.id, action: "admin.ticket.reply", entity: "SupportTicket", entityId: ticketId });
  revalidatePath(`/admin/support/${ticketId}`);
  redirect(`/admin/support/${ticketId}?flash=message_sent`);
}

export async function updateTicketStatus(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.SUPPORT_MANAGE);
  const ticketId = toStr(formData.get("ticketId"));
  const status = toStr(formData.get("status"));
  if (!["OPEN", "PENDING", "RESOLVED", "CLOSED"].includes(status)) redirect(`/admin/support/${ticketId}?flash=invalid_input`);

  const ticket = await prisma.supportTicket.update({ where: { id: ticketId }, data: { status } });
  await notify({ userId: ticket.userId, title: "Ticket updated", body: `Your ticket ${ticket.ticketNo} is now ${status.toLowerCase()}.`, link: `/account/tickets/${ticketId}` });
  await audit({ userId: staff.id, action: "admin.ticket.status", entity: "SupportTicket", entityId: ticketId, meta: { status } });
  revalidatePath(`/admin/support/${ticketId}`);
  redirect(`/admin/support/${ticketId}?flash=updated`);
}

export async function updateContactMessage(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.SUPPORT_MANAGE);
  const id = toStr(formData.get("id"));
  const status = toStr(formData.get("status"));
  await prisma.contactMessage.update({ where: { id }, data: { status } });
  await audit({ userId: staff.id, action: "admin.contact.status", entity: "ContactMessage", entityId: id, meta: { status } });
  revalidatePath("/admin/messages");
  redirect("/admin/messages?flash=updated");
}

export async function moderateReview(formData: FormData) {
  const staff = await requireStaff(PERMISSIONS.CMS_MANAGE);
  const id = toStr(formData.get("id"));
  const decision = toStr(formData.get("decision"));
  if (decision === "APPROVE") {
    await prisma.review.update({ where: { id }, data: { approved: true } });
  } else {
    await prisma.review.delete({ where: { id } }).catch(() => null);
  }
  await audit({ userId: staff.id, action: `admin.review.${decision.toLowerCase()}`, entity: "Review", entityId: id });
  revalidatePath("/admin/content");
  redirect("/admin/content?flash=updated");
}
