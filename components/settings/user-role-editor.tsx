"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";

const ROLES: Role[] = ["VIEWER", "EDITOR", "ADMIN"];

export function UserRoleEditor({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: Role;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: Role) {
    setRole(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRole(currentRole);
        setError(
          typeof data.error === "string" ? data.error : "Failed to update role"
        );
        return;
      }
      router.refresh();
    } catch {
      setRole(currentRole);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (disabled) {
    return <span className="text-xs text-slate-400">Admin (can&apos;t change own role)</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as Role)}
        className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}