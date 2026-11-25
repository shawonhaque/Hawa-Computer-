import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { readUpload } from "@/lib/storage";
import { canAny } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await prisma.uploadedFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const staffAccess = canAny(user, [
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.APPLICATION_DOCUMENTS,
    PERMISSIONS.PAYMENT_VERIFY,
  ]);

  let allowed = file.uploadedById === user.id || (file.isPublic && true) || (user.role.isStaff && staffAccess);

  if (!allowed) {
    const linked = await prisma.orderFile.findFirst({
      where: {
        fileId: file.id,
        serviceOrder: { customerId: user.id },
      },
      select: { id: true },
    });
    const doc = await prisma.applicationDocument.findFirst({
      where: { fileId: file.id, application: { customerId: user.id } },
      select: { id: true },
    });
    const payment = await prisma.payment.findFirst({
      where: {
        screenshotId: file.id,
        OR: [{ payerId: user.id }, { order: { customerId: user.id } }],
      },
      select: { id: true },
    });
    allowed = Boolean(linked || doc || payment);
  }

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const buffer = await readUpload(file.storedName);
    const inline = file.mime.startsWith("image/") || file.mime === "application/pdf";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(file.originalName)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing from storage" }, { status: 410 });
  }
}
