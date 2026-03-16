
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RevenueData } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface RevenueChartProps {
  data: RevenueData[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                data={data}
                margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                }}
                >
                <defs>
                    <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#84cc16" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.5)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--recharts-text-color)' }} axisLine={false} tickLine={false} />
                <YAxis
                    tickFormatter={(value) => `KES ${Number(value) / 1000}k`}
                    tick={{ fill: 'var(--recharts-text-color)' }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                    contentStyle={{
                    background: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#d1d5db' }}
                />
                <Legend iconType="circle" iconSize={10} />
                <Area type="monotone" dataKey="billed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBilled)" />
                <Area type="monotone" dataKey="collected" stroke="#84cc16" fillOpacity={1} fill="url(#colorCollected)" />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
  );
};

export default RevenueChart;