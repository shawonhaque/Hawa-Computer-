import Link from "next/link";
import { Download, FileText, FolderOpen } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AccountFilesPage() {
  const user = await requireUser("/account/files");
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  const files = await prisma.uploadedFile.findMany({
    where: { uploadedById: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title={d.account.files} description={bn ? "আপনার আপলোড করা সব ফাইল, শুধু আপনি দেখতে পারেন।" : "All files you uploaded — visible only to you and authorised staff."} />
      {files.length === 0 ? (
        <EmptyState icon={<FolderOpen size={22} />} title={bn ? "কোনো ফাইল নেই" : "No files yet"} body={d.empty.body} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{bn ? "ফাইল" : "File"}</th>
                <th>{bn ? "ধরন" : "Type"}</th>
                <th>{bn ? "আকার" : "Size"}</th>
                <th>{d.common.date}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="flex items-center gap-2 font-medium"><FileText size={14} className="text-muted" /> <span className="truncate">{file.originalName}</span></td>
                  <td className="text-muted">{file.mime}</td>
                  <td className="text-muted">{Math.round(file.size / 1024)} KB</td>
                  <td className="text-muted">{formatDateTime(file.createdAt, locale)}</td>
                  <td className="text-right">
                    <Link href={`/api/files/${file.id}`} target="_blank" className="text-xs font-semibold text-royal"><Download size={14} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
