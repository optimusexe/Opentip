export type HistoryRowKeyInput = {
  direction: string;
  kind: string;
  hash: string;
  token?: string | null;
  symbol?: string | null;
};

export function historyRowKey(row: HistoryRowKeyInput, index: number): string {
  const token = row.token ?? row.symbol ?? "none";
  return `${row.direction}-${row.kind}-${row.hash}-${token}-${index}`;
}
