
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsCardProps {
  title: string;
  description: string;
  data: Record<string, number>;
  type: "pie" | "bar";
}

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  description,
  data,
  type,
}) => {
  // Convert data object to array format for charts
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === "pie" ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value) => [`${value} queries`, ""]} />
              </PieChart>
            ) : (
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} queries`, ""]} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;
