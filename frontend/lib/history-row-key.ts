export type HistoryRowKeyInput = {
  direction: string;
  kind: string;
  hash: string;
  token?: string | null;
  symbol?: string | null;
};

// Two legs of one claim share a hash. The token keeps their keys apart.
export function historyRowKey(row: HistoryRowKeyInput, index: number): string {
  const token = row.token ?? row.symbol ?? "none";
  return `${row.direction}-${row.kind}-${row.hash}-${token}-${index}`;
}
