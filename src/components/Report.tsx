import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { CheckCircle2, AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ReportProps {
  finalScore: number;
  scoreHistory: number[];
  activityCounts: {
    looking_away: number;
    face_missing: number;
    tab_switch: number;
    multiple_faces: number;
  };
  onRestart: () => void;
}

export const Report: React.FC<ReportProps> = ({ 
  finalScore, 
  scoreHistory, 
  activityCounts,
  onRestart 
}) => {
  const isCheating = finalScore >= 8;
  const isSuspicious = finalScore >= 3 && finalScore < 8;

  const lineChartData = {
    labels: scoreHistory.map((_, i) => `${i}s`),
    datasets: [
      {
        label: 'Suspicion Score',
        data: scoreHistory,
        borderColor: 'rgb(24, 24, 27)',
        backgroundColor: 'rgba(24, 24, 27, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barChartData = {
    labels: ['Looking Away', 'Face Missing', 'Tab Switch', 'Multiple People'],
    datasets: [
      {
        label: 'Activity Distribution',
        data: [
          activityCounts.looking_away,
          activityCounts.face_missing,
          activityCounts.tab_switch,
          activityCounts.multiple_faces,
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(59, 130, 246, 0.6)',
        ],
        borderColor: [
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-zinc-200/50 border border-zinc-100 p-12">
        <div className="flex flex-col items-center text-center mb-12">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            isCheating ? 'bg-red-100 text-red-600' : 
            isSuspicious ? 'bg-amber-100 text-amber-600' : 
            'bg-green-100 text-green-600'
          }`}>
            {isCheating ? <ShieldAlert className="w-10 h-10" /> : 
             isSuspicious ? <AlertTriangle className="w-10 h-10" /> : 
             <CheckCircle2 className="w-10 h-10" />}
          </div>
          
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Exam Session Report</h1>
          <p className="text-zinc-500 max-w-md">
            Final proctoring analysis based on AI-driven behavior monitoring and browser event tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100 flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Final Score</span>
            <span className={`text-6xl font-black ${
              isCheating ? 'text-red-500' : 
              isSuspicious ? 'text-amber-500' : 
              'text-green-500'
            }`}>{finalScore}</span>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100 flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Status</span>
            <span className={`text-2xl font-bold uppercase tracking-tighter ${
              isCheating ? 'text-red-500' : 
              isSuspicious ? 'text-amber-500' : 
              'text-green-500'
            }`}>
              {isCheating ? 'Cheating Detected' : 
               isSuspicious ? 'Suspicious Activity' : 
               'Normal Session'}
            </span>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100 flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Total Events</span>
            <span className="text-6xl font-black text-zinc-900">
              {activityCounts.looking_away + activityCounts.face_missing + activityCounts.tab_switch + activityCounts.multiple_faces}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-zinc-800 uppercase tracking-tight">Suspicion Over Time</h3>
            <div className="h-[300px] bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-zinc-800 uppercase tracking-tight">Activity Distribution</h3>
            <div className="h-[300px] bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onRestart}
            className="flex items-center gap-3 bg-zinc-900 text-white px-10 py-4 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 font-bold uppercase tracking-widest text-sm"
          >
            <RefreshCw className="w-5 h-5" />
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
};
