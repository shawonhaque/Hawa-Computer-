import Link from "next/link";
import { Bell, ExternalLink, LogOut } from "lucide-react";
import { logout } from "@/actions/auth";

export function DashboardTopbar({
  title,
  userName,
  roleName,
  notifications,
  backHref = "/",
  backLabel = "View site",
  profileHref = "/account/profile",
}: {
  title: string;
  userName: string;
  roleName: string;
  notifications: number;
  backHref?: string;
  backLabel?: string;
  profileHref?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
      <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
      <div className="flex items-center gap-1.5">
        <Link href={backHref} className="btn btn-ghost btn-sm hidden sm:inline-flex">
          <ExternalLink size={14} /> {backLabel}
        </Link>
        <Link href={profileHref === "/account/profile" ? "/account/notifications" : "/admin"} className="btn btn-ghost btn-icon relative" aria-label="Notifications">
          <Bell size={17} />
          {notifications > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.6rem] font-bold text-white">
              {notifications > 9 ? "9+" : notifications}
            </span>
          ) : null}
        </Link>
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold leading-tight">{userName}</p>
          <p className="text-[0.65rem] text-muted">{roleName}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-ghost btn-icon text-danger" aria-label="Log out" title="Log out">
            <LogOut size={17} />
          </button>
        </form>
      </div>
    </header>
  );
}
