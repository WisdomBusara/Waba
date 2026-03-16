import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NRWData } from '../types';

interface NRWChartProps {
  data: NRWData[];
}

const NRWChart: React.FC<NRWChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.5)" />
          <XAxis dataKey="day" tick={{ fill: 'var(--recharts-text-color)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(value) => `${value}%`}
            domain={['dataMin - 2', 'dataMax + 2']}
            tick={{ fill: 'var(--recharts-text-color)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1f2937',
              borderColor: '#374151',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: '#d1d5db' }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'NRW']}
          />
          <Line type="monotone" dataKey="percentage" name="NRW" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NRWChart;