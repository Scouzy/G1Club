import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface StatsChartProps {
  type: 'performance' | 'attendance' | 'radar' | 'activity';
  data: any[];
}

const StatsChart: React.FC<StatsChartProps> = ({ type, data }) => {
  if (type === 'activity') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" name="Séances" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'performance') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="rating" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'attendance') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="present" fill="#82ca9d" name="Présences" />
          <Bar dataKey="absent" fill="#ff7f7f" name="Absences" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'radar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar name="Compétences" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Legend />
            </RadarChart>
        </ResponsiveContainer>
      )
  }

  return <div>Type de graphique invalide</div>;
};

export default StatsChart;
