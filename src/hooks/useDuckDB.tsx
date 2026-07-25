import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface DuckDBContextValue {
  loading: boolean;
  error: string | null;
  ready: boolean;
  query: <T = Record<string, unknown>>(sql: string) => Promise<T[]>;
}

const DuckDBContext = createContext<DuckDBContextValue>({
  loading: true,
  error: null,
  ready: false,
  query: async () => [],
});

export function DuckDBProvider({ children }: { children: ReactNode }) {
  const [conn, setConn] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const duckdb = await import('@duckdb/duckdb-wasm');

        // Use jsdelivr CDN for WASM bundles (no local files needed)
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        if (!bundle.mainWorker) {
          throw new Error('No suitable DuckDB-WASM worker bundle found');
        }

        // Create worker via blob URL to avoid CORS with CDN
        const workerUrl = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], {
            type: 'text/javascript',
          })
        );

        const worker = new Worker(workerUrl);
        const logger = new duckdb.ConsoleLogger();
        const database = new duckdb.AsyncDuckDB(logger, worker);
        await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(workerUrl);

        const connection = await database.connect();

        // Load the Parquet file
        const response = await fetch('/data/ph_rain_forecast.parquet');
        if (!response.ok) {
          throw new Error(`Failed to fetch parquet file: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        await database.registerFileBuffer(
          'ph_rain_forecast.parquet',
          new Uint8Array(buffer)
        );

        await connection.query(`
          CREATE VIEW weather AS 
          SELECT * FROM read_parquet('ph_rain_forecast.parquet')
        `);

        if (!cancelled) {
          setConn(connection);
          setLoading(false);
        }
      } catch (err) {
        console.error('DuckDB-WASM init error:', err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to initialize DuckDB'
          );
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const query = useCallback(
    async <T = Record<string, unknown>>(sql: string): Promise<T[]> => {
      if (!conn) throw new Error('DuckDB not initialized');
      const connection = conn as import('@duckdb/duckdb-wasm').AsyncDuckDBConnection;
      const result = await connection.query(sql);
      return result.toArray().map((row: { toJSON: () => unknown }) => row.toJSON() as T);
    },
    [conn]
  );

  return (
    <DuckDBContext.Provider value={{ loading, error, ready: !!conn, query }}>
      {children}
    </DuckDBContext.Provider>
  );
}

export function useDuckDB() {
  return useContext(DuckDBContext);
}
