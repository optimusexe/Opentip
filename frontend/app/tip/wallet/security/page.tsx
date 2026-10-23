import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SecurityClient from "./SecurityClient";

export const metadata = { title: "Security | Opentip" };

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/tip/signin?callbackUrl=/tip/wallet/security");
  return <SecurityClient />;
}
