import { auth } from "@/auth";
import { DEV_USER_ID } from "@/lib/product/constants";

export async function getActor() {
  if (process.env.AUTH_REQUIRED !== "true") {
    return { id: DEV_USER_ID, email: "dev@grindstone.local", name: "Local member", authenticated: false };
  }
  const session = await auth();
  const user = session?.user;
  const id = user?.id;
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return { id, email: user?.email ?? "member@grindstone.local", name: user?.name ?? "Member", authenticated: true };
  }
  return null;
}
