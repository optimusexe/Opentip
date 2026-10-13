const LOGO: Record<string, string> = {
  ETH: "/tokens/eth.png",
  USDC: "/tokens/usdc.png",
  OAR: "/tokens/oar.png",
};

export function TokenLogo({ symbol }: { symbol: string }) {
  const src = LOGO[symbol.toUpperCase()];
  if (!src) return null;
  // Trust Wallet's ETH mark is a light diamond. A dark disc keeps it visible on the light page.
  const plate = symbol.toUpperCase() === "ETH" ? "bg-[#1c2024]" : "";
  return (
    <img
      src={src}
      alt=""
      width={32}
      height={32}
      className={`size-8 shrink-0 rounded-full ${plate}`}
    />
  );
}
