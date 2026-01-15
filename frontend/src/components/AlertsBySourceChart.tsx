import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface AlertsBySourceChartProps {
    data: Array<{ name: string; value: number; color: string }>
}

const RADIAN = Math.PI / 180

export default function AlertsBySourceChart({ data }: AlertsBySourceChartProps) {
    const total = data.reduce((sum, entry) => sum + entry.value, 0)

    return (
        <div className="glass-card p-5">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Alerts by Source
            </h3>
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#e2e8f0',
                        }}
                        formatter={(value: number) => [`${value} alerts`, '']}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                            <span className="text-slate-300 text-sm">{value}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
