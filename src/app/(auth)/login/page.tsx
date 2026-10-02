import type { Metadata } from "next";
import { first } from "@/lib/search";
import Flash from "@/components/flash";
import PageTransition from "@/components/page-transition";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const registered = first((await searchParams).registered);

  return (
    <PageTransition>
      <Flash
        saved={registered}
        param="registered"
        message="Account created. You can sign in now."
      />
      <LoginForm />
    </PageTransition>
  );
}
