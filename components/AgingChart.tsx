import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AgingData } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface AgingChartProps {
  data: AgingData[];
}

const AgingChart: React.FC<AgingChartProps> = ({ data }) => {
  return (
    <Card className="h-full">
        <CardHeader>
            <CardTitle>Debt Aging Analysis</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={5}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => `KES ${value.toLocaleString()}`}
                        contentStyle={{
                            background: '#1f2937',
                            borderColor: '#374151',
                            borderRadius: '0.5rem',
                        }}
                    />
                    <Legend iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
  );
};

export default AgingChart;
