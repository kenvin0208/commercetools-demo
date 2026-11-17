import { redirect } from "next/navigation";
import { currentCustomer } from "@/src/lib/account/session";

export default async function AccountPage() {
  redirect(await currentCustomer() ? "/account/profile" : "/account/login");
}
