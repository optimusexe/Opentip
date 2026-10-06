"use client";
import { useCallback, useEffect, useRef } from "react";
import { useAuthenticateWithJWT, useCurrentUser, useIsSignedIn, useSendUserOperation, useSignEvmMessage } from "@coinbase/cdp-hooks";
import { CHAIN_ID } from "./chain";
import { DATA_SUFFIX } from "./builderCode";

export type OpentipCall = {
  to: `0x${string}`;
  // bigint wei — the SDK stringifies to decimal for the API. Hex strings are rejected.
  value?: bigint;
  data?: `0x${string}`;
};

// Shared signing layer for the Opentip Smart Wallet (CDP Embedded).
// Ensures a silent CDP session first (JWT via /api/auth/cdp-jwt, no gesture),
// then submits calls as one user operation with bc_s44rnr4k attribution.
// User pays gas — no paymaster. Throws with human-readable messages.
// NOTE: CDP's sendUserOperation is wrapped in useEnforceAuthenticated, which
// closes over isSignedIn at render time. Calling it in the same tick as
// authenticateWithJWT() throws "User is not authenticated" because React
// state hasn't re-rendered yet — so we wait for the context to flip first.
export function useOpentipSend() {
  const { authenticateWithJWT } = useAuthenticateWithJWT();
  const { currentUser } = useCurrentUser();
  const { isSignedIn } = useIsSignedIn();
  const { sendUserOperation, data, error, status } = useSendUserOperation();
  const { signEvmMessage } = useSignEvmMessage();

  const signedInRef = useRef(isSignedIn);
  const sendRef = useRef(sendUserOperation);
  const userRef = useRef(currentUser);
  useEffect(() => {
    signedInRef.current = isSignedIn;
    sendRef.current = sendUserOperation;
    userRef.current = currentUser;
  });

  // Silent CDP session (JWT, no gesture). No-op when already signed in.
  // Safe to call on page mount as an invisible warm-up, and called by
  // send() first so click-time connects need no UI of their own.
  const ensureSignedIn = useCallback(async (): Promise<void> => {
    if (signedInRef.current) return;
    // Retry once: the CDP API call can fail transiently (or be blocked by
    // adblocker/privacy extensions killing *.coinbase.com requests).
    let result: any = null;
    let lastErr: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        result = await authenticateWithJWT();
        lastErr = null;
        break;
      } catch (e: any) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (lastErr) {
      const msg = lastErr?.message || "";
      if (lastErr instanceof TypeError && msg.includes("Failed to fetch")) {
        throw new Error(
          "Couldn't reach Coinbase CDP — an adblocker or privacy extension is likely blocking it. Disable extensions for this site (or try incognito without extensions) and try again."
        );
      }
      throw lastErr;
    }
    if (result?.user) userRef.current = result.user;
    // Wait for CDP context to flip — the wrapped send closes over isSignedIn
    const start = Date.now();
    while (!signedInRef.current && Date.now() - start < 15000) {
      await new Promise((r) => setTimeout(r, 150));
    }
    if (!signedInRef.current) {
      throw new Error("CDP session not ready — try again");
    }
  }, [authenticateWithJWT]);

  const send = useCallback(
    async (calls: OpentipCall[]): Promise<{ userOperationHash?: string; sponsored?: boolean }> => {
      // Connect first if needed (silent — no gesture), then send. The
      // smart-account check below runs on fresh post-auth state, so a
      // cold CDP context never trips it.
      await ensureSignedIn();
      // Policy gate the official client runs before CDP signs in the browser.
      // Pause, the recipient allowlist, and USD caps (unpriced tokens blocked,
      // not treated as $0) are checked here. The paymaster also refuses to
      // sponsor while transactions are paused. A modified client can still
      // ask the browser SDK to sign a user-paid operation; the server does
      // not hold the signing key. External EOAs sign in their own apps.
      const checkRes = await fetch("/api/wallet/policy/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calls: calls.map((c) => ({
            to: c.to,
            value: (c.value ?? BigInt(0)).toString(),
            data: c.data ?? "0x",
          })),
        }),
      }).catch(() => null);
      const check = await checkRes?.json().catch(() => null);
      if (!check || check.allowed !== true) {
        throw new Error(check?.reason || "Blocked by wallet security policy.");
      }
      const user: any = userRef.current;
      const smartAccount =
        user?.evmSmartAccountObjects?.[0]?.address ||
        user?.evmSmartAccounts?.[0] ||
        null;

      if (!smartAccount) {
        throw new Error("No Opentip Smart Wallet — create one in /dashboard/wallets first");
      }
      // Gas is sponsored through our paymaster proxy (never raw URL — it
      // carries our client API key). Absolute URL required: CDP's backend
      // validates this field as a full HTTP(S) URL and rejects relative
      // paths with 400 invalid_request. window.location.origin keeps it
      // correct in every environment with no env vars. On 429 (daily cap
      // hit between review and send) fall back to user-paid so the action
      // never dead-ends.
      const paymasterUrl = `${window.location.origin}/api/paymaster`;
      const baseOp = {
        evmSmartAccount: smartAccount,
        network: (CHAIN_ID === 8453 ? "base" : "base-sepolia") as any,
        calls: calls.map((c) => ({
          to: c.to,
          value: c.value ?? BigInt(0),
          data: c.data ?? "0x",
        })),
        dataSuffix: DATA_SUFFIX as `0x${string}`,
      } as any;
      try {
        const result: any = await sendRef.current({ ...baseOp, paymasterUrl });
        return { userOperationHash: result?.userOperationHash, sponsored: true };
      } catch (e: any) {
        const code = e?.status ?? e?.statusCode ?? e?.response?.status;
        const msg = String(e?.message || "");
        const capped =
          code === 429 || msg.includes("429") || msg.toLowerCase().includes("daily sponsorship");
        if (!capped) throw e;
        const retry: any = await sendRef.current(baseOp);
        return { userOperationHash: retry?.userOperationHash, sponsored: false };
      }
    },
    [authenticateWithJWT, ensureSignedIn]
  );

  // Signs with the smart account's owner key. The display-name API checks
  // that this owner controls the smart account address in the message.
  const signMessage = useCallback(async (message: string): Promise<`0x${string}`> => {
    await ensureSignedIn();
    const user: any = userRef.current;
    const evmAccount =
      user?.evmAccountObjects?.[0]?.address ||
      user?.evmAccounts?.[0] ||
      null;
    if (!evmAccount) throw new Error("CDP session not ready — try again");
    const result = await signEvmMessage({ evmAccount, message });
    if (!result?.signature) throw new Error("Smart Wallet did not return a signature");
    return result.signature;
  }, [ensureSignedIn, signEvmMessage]);

  const smartAddress: string | null =
    (currentUser as any)?.evmSmartAccountObjects?.[0]?.address ||
    (currentUser as any)?.evmSmartAccounts?.[0] ||
    null;

  // data = confirmed user op (has transactionHash) once the hook's internal wait completes
  return { send, signMessage, smartAddress, ensureSignedIn, txData: data, txError: error, txStatus: status };
}
