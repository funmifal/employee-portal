import { requireRole } from "@/lib/auth/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { UserRoleEditor } from "@/components/settings/user-role-editor";

export const metadata = {
  title: "Settings — Users",
};

export default async function SettingsPage() {
  const actor = await requireRole([Role.ADMIN]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User management</h1>
        <p className="text-sm text-slate-600 mt-1">
          Assign roles to control upload, compile, and publish permissions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {users.map((user) => (
          <div key={user.id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {user.name ?? user.email}
                {user.id === actor.id && (
                  <span className="ml-2 text-xs text-slate-400">(you)</span>
                )}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <UserRoleEditor
              userId={user.id}
              currentRole={user.role}
              disabled={user.id === actor.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}