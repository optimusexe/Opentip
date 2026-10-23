"use client";

import { wagmiAdapter, projectId, networks } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { OptionsController } from "@reown/appkit-controllers";
import { base, baseSepolia } from "@reown/appkit/networks";
import { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

const queryClient = new QueryClient();

const metadata = {
  name: "Opentip Tip",
  description: "Tips for open source. Tip any GitHub repo in crypto",
  url: "https://opentip.tech/tip",
  icons: ["https://opentip.tech/Opentip.png"],
};

// Fully removed Base Account / Coinbase Wallet sign-in per user request.
// CDP Embedded is now the primary Opentip Smart Wallet.
// NOTE: createAppKit() in this Reown version forwards options only through
// individual setters (no setEnableCoinbase), so the documented
// `enableCoinbase` flag below is dead config kept for forward-compat.
// What actually gates the connector is OptionsController.state, which the
// WagmiAdapter checks (`enableCoinbase !== false`) when adding third-party
// connectors — so it must be set BEFORE createAppKit() runs.
OptionsController.setOptions({ enableCoinbase: false } as any);

createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId || "demo",
  networks,
  defaultNetwork: process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia,
  metadata,
  features: { analytics: true },
  enableCoinbase: false as any,
});

export default function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
