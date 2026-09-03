import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/server/session";
import SignInForm from "@/components/auth/signin-form";

export const metadata = { title: "Sign in — Wapsi" };

export default async function SignInPage() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  return <SignInForm />;
}
