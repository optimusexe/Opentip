import { redirect } from "next/navigation";
import { ReceiptScreen } from "./ReceiptScreen";
import { getTokenPrices } from "@/lib/prices";
import { loadReceipt } from "@/lib/receipt";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ txHash: string }> }) {
  const { txHash } = await params;
  return { title: `Receipt ${txHash.slice(0, 10)}` };
}

export default async function ReceiptPage({ params }: { params: Promise<{ txHash: string }> }) {
  const { txHash } = await params;
  const receipt = await loadReceipt(txHash);
  if (receipt.canonicalHash && receipt.canonicalHash.toLowerCase() !== decodeURIComponent(txHash).toLowerCase()) {
    redirect(`/tip/receipt/${receipt.canonicalHash}`);
  }
  const network = process.env.NEXT_PUBLIC_CHAIN === "base" ? "Base" : "Base Sepolia";
  const prices = await getTokenPrices().catch(() => ({} as Record<string, number>));
  return <ReceiptScreen receipt={receipt} network={network} prices={prices} />;
}
