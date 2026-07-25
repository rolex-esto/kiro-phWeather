/**
 * DuckDB-WASM returns BigInt values for integer columns.
 * Recharts (and most JS charting libs) can't handle BigInt.
 * This helper converts all BigInt values in query results to regular numbers.
 */
export function convertBigInts<T>(rows: T[]): T[] {
  return rows.map((row) => {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      if (typeof value === 'bigint') {
        converted[key] = Number(value);
      } else {
        converted[key] = value;
      }
    }
    return converted as T;
  });
}
