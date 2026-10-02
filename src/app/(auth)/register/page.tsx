import type { Metadata } from "next";
import PageTransition from "@/components/page-transition";
import RegisterForm from "./register-form";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <PageTransition>
      <RegisterForm />
    </PageTransition>
  );
}
