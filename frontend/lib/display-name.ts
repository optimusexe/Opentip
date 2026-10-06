export function displayNameMessage(displayName: string, address: string): string {
  return `Set display name: ${displayName} for ${address}`;
}

// EOA signatures verify locally. Smart-wallet signatures need a client that
// understands ERC-1271 and ERC-6492. Coinbase smart accounts often sign with
// the owner key instead, so an owner check is the last resort.
export async function acceptDisplayNameSignature(checks: {
  local: () => Promise<boolean>;
  contract: () => Promise<boolean>;
  owner: () => Promise<boolean>;
}): Promise<boolean> {
  for (const check of [checks.local, checks.contract, checks.owner]) {
    try {
      if (await check()) return true;
    } catch {
      // A malformed signature or a contract without isValidSignature falls through.
    }
  }
  return false;
}
