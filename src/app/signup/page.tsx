
"use client";

import AuthForm from "@/components/auth-form";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // On successful signup, the auth form switches to the login tab
    // so we can just stay on this page which will now show the login form.
    // Or we could redirect to a specific "check your email" page.
    // For now, let's redirect to login.
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthForm defaultTab="signup" onSuccess={handleSuccess} />
    </div>
  );
}
