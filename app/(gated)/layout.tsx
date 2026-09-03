import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/session";
import { UserProvider } from "@/lib/user-context";
import { publicUser } from "../api/auth/public-user";

/**
 * The gate (plan §6, task 0.3). Everything under this group needs a signed-in account
 * that has finished onboarding once. Next 16 calls middleware "proxy" and says not to
 * use it for session checks, so the check lives here, in a server layout, where the
 * database is one import away.
 */
export default async function GatedLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (!user.onboardedAt) redirect("/welcome");
  return <UserProvider user={publicUser(user)}>{children}</UserProvider>;
}
