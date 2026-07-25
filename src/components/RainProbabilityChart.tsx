import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useDuckDB } from '../hooks/useDuckDB';
import { convertBigInts } from '../utils/query-helpers';

interface ChartData {
  label: string;
  rain_probability: number;
  rainfall_mm: number;
}

interface Props {
  region: string;
}

export function RainProbabilityChart({ region }: Props) {
  const { query } = useDuckDB();
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    query<ChartData>(`
      SELECT 
        strftime(date, '%a %m/%d') as label,
        ROUND(AVG(rain_probability), 0) as rain_probability,
        ROUND(SUM(rainfall_mm), 1) as rainfall_mm
      FROM weather 
      WHERE region = '${region}'
      GROUP BY date
      ORDER BY date
    `).then((rows) => setData(convertBigInts(rows)));
  }, [query, region]);

  if (data.length === 0) return <p style={{ color: '#666', textAlign: 'center' }}>Loading chart...</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4fc3f7" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#4fc3f7" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
          formatter={(value: number, name: string) => [
            name === 'rain_probability' ? `${value}%` : `${value} mm`,
            name === 'rain_probability' ? 'Rain Chance' : 'Total Rainfall',
          ]}
        />
        <ReferenceLine
          y={50}
          stroke="#ff9800"
          strokeDasharray="5 5"
          label={{ value: 'Likely rain above', position: 'insideTopRight', fontSize: 10, fill: '#ff9800' }}
        />
        <Area
          type="monotone"
          dataKey="rain_probability"
          stroke="#1a73e8"
          fillOpacity={1}
          fill="url(#rainGrad)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#1a73e8', strokeWidth: 2, stroke: 'white' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
