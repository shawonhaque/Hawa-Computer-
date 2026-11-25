import {
  BookOpen, Boxes, CalendarRange, Contact, CreditCard, FileText, GraduationCap, LayoutDashboard,
  LayoutTemplate, LifeBuoy, Mail, Package, Receipt, ReceiptText, ScrollText, Settings, ShieldCheck,
  ShoppingBag, Sparkles, Truck, Undo2, UserCog, Users, Wallet, Wrench, BarChart3, Printer, Camera,
  ScanLine, PenLine, FileCheck2, Library, Laptop, Landmark, ClipboardList, IdCard, Baby, Briefcase,
  FilePen, GraduationCap as Cap, BookMarked, type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Sparkles, FileText, Camera, Printer, ScanLine, PenLine, FileCheck2, Library, Laptop, Landmark,
  ClipboardList, IdCard, Baby, Briefcase, FilePen, GraduationCap, BookMarked, BookOpen, ShoppingBag,
  Package, Boxes, Truck, Wallet, CreditCard, Undo2, Receipt, ReceiptText, BarChart3, Users, UserCog,
  ShieldCheck, ScrollText, LayoutTemplate, Settings, LifeBuoy, Mail, Contact, CalendarRange, Wrench,
  LayoutDashboard, Cap,
};

export function Icon({ name, size = 18, className }: { name?: string | null; size?: number; className?: string }) {
  const Component = (name && map[name]) || Sparkles;
  return <Component size={size} className={className} aria-hidden="true" />;
}
