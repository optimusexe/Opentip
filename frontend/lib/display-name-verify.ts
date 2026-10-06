import { createPublicClient, http, recoverMessageAddress, verifyMessage, type Address, type Hex } from "viem";
import { RPC_URL, VIEM_CHAIN } from "./chain";
import { acceptDisplayNameSignature } from "./display-name";

const ownerAbi = [
  {
    name: "isOwnerAddress",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "isOwner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

// Local ECDSA covers external wallets. A public client covers contract
// signatures (ERC-1271 / ERC-6492). Coinbase smart accounts sign with the
// owner key, so that owner is accepted when the contract says they own it.
export async function displayNameSignatureValid(
  address: Address,
  message: string,
  signature: Hex,
): Promise<boolean> {
  const client = RPC_URL
    ? createPublicClient({ chain: VIEM_CHAIN, transport: http(RPC_URL) })
    : null;

  return acceptDisplayNameSignature({
    local: () => verifyMessage({ address, message, signature }),
    contract: async () => {
      if (!client) return false;
      return client.verifyMessage({ address, message, signature });
    },
    owner: async () => {
      if (!client) return false;
      const signer = await recoverMessageAddress({ message, signature });
      if (signer.toLowerCase() === address.toLowerCase()) return true;
      const bytecode = await client.getBytecode({ address });
      if (!bytecode || bytecode === "0x") return false;
      for (const functionName of ["isOwnerAddress", "isOwner"] as const) {
        try {
          const owns = await client.readContract({
            address,
            abi: ownerAbi,
            functionName,
            args: [signer],
          });
          if (owns) return true;
        } catch {
          // This wallet contract doesn't expose that owner method.
        }
      }
      return false;
    },
  });
}
