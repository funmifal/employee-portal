import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#edf7f5] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-8 shadow">
        <h1 className="text-2xl font-bold text-[#2f6b5f]">Employee Portal</h1>
        <p className="text-sm text-slate-600 mt-1">
          Note digitization &amp; manual compiler
        </p>
        <LoginForm />
      </div>
    </main>
  );
}