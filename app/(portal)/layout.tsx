import Link from "next/link";
import { getSessionUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { canManageUsers, canUploadBatches } from "@/lib/permissions/roles";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/email", label: "Email Jobs" },
    { href: "/jobs", label: "Jobs" },
    { href: "/dead-letters", label: "Dead Letters" },
    ...(canUploadBatches(user.role)
      ? [{ href: "/uploads", label: "Uploads" }, { href: "/processing", label: "Processing" }]
      : []),
    { href: "/manuals", label: "Manuals" },
    { href: "/search", label: "Search" },
    ...(canManageUsers(user.role) ? [{ href: "/settings", label: "Settings" }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-[#2f6b5f]">
            Employee Portal
          </Link>
          <nav className="flex items-center gap-1 text-sm" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {user.name ?? user.email}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#dcefeb] text-[#2f6b5f] font-semibold">
                {user.role}
              </span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}