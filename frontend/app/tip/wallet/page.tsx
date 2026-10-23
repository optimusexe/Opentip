import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WalletClient from "./WalletClient";

export const metadata = { title: "Wallet | Opentip" };

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/tip/signin?callbackUrl=/tip/wallet");
  const userId = (session.user as any)?.id as string | undefined;
  // Server-render the wallet list so first paint already shows the real
  // wallet — the client revalidates in the background. Serialized for
  // the client boundary (Date -> string).
  const initialLinked = userId
    ? JSON.parse(
        JSON.stringify(
          await prisma.userWallet.findMany({ where: { userId } }).catch(() => [])
        )
      )
    : [];
  return <WalletClient initialLinked={initialLinked} />;
}
