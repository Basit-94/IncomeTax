import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/server/session";
import WelcomeClient from "@/components/auth/welcome-client";
import { publicUser } from "../api/auth/public-user";

export const metadata = { title: "Welcome — Wapsi" };

/**
 * Onboarding, once per account (plan §6). A person who has answered already is sent to
 * their surface unless they came to edit their answers, which never resets the stamp.
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { edit } = await searchParams;
  if (user.onboardedAt && edit !== "1") redirect(homeFor(user));
  return <WelcomeClient user={publicUser(user)} editing={edit === "1"} />;
}
