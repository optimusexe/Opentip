// 0n is falsy, so `{value && value > 0n && <Row />}` evaluates to 0n.
// React renders that bigint as the text "0". Check the type first.
export function isPositiveBigint(value: unknown): value is bigint {
  return typeof value === "bigint" && value > 0n;
}
