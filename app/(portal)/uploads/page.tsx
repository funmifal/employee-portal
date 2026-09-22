import { requireRole } from "@/lib/auth/server";
import { Role } from "@prisma/client";
import { UploadForm } from "@/components/uploads/upload-form";

export const metadata = {
  title: "Upload notes",
};

export default async function UploadsPage() {
  await requireRole([Role.EDITOR, Role.ADMIN]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload employee notes</h1>
        <p className="text-sm text-slate-600 mt-1">
          Supported formats: JPEG, PNG, WebP. Batch limit: 50MB total.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}