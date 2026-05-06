// @ts-nocheck
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { useEffect, useState } from 'react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Get CSS variable value
function getCSSVariable(variable: string): string {
  if (typeof window === 'undefined') return '#000000';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
}

// Convert HSL to hex color
function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map((v) => parseFloat(v));
  const lightness = l / 100;
  const a = (s / 100) * Math.min(lightness, 1 - lightness);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Get theme colors
function getThemeColors() {
  const primary = getCSSVariable('--primary');
  const secondary = getCSSVariable('--secondary');
  const success = getCSSVariable('--success');
  const warning = getCSSVariable('--warning');
  const destructive = getCSSVariable('--destructive');
  const muted = getCSSVariable('--muted-foreground');
  const foreground = getCSSVariable('--foreground');
  const border = getCSSVariable('--border');

  return {
    primary: hslToHex(primary),
    secondary: hslToHex(secondary),
    success: hslToHex(success),
    warning: hslToHex(warning),
    destructive: hslToHex(destructive),
    muted: hslToHex(muted),
    foreground: hslToHex(foreground),
    border: hslToHex(border),
  };
}

// Default minimal chart options
export function getMinimalChartOptions(overrides?: Partial<ChartOptions>): ChartOptions {
  const colors = getThemeColors();

  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: colors.foreground,
          font: {
            size: 12,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: colors.foreground,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: colors.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        titleFont: {
          size: 13,
          weight: '600',
        },
        bodyFont: {
          size: 12,
        },
        displayColors: true,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: colors.muted,
          font: {
            size: 11,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: colors.border,
          drawBorder: false,
        },
        ticks: {
          color: colors.muted,
          font: {
            size: 11,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
    ...overrides,
  } as ChartOptions;
}

// Line Chart Component
interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      tension?: number;
      fill?: boolean;
    }[];
  };
  options?: Partial<ChartOptions<'line'>>;
  height?: number;
}

export function LineChart({ data, options, height = 300 }: LineChartProps) {
  const [chartData, setChartData] = useState(data);
  const [chartOptions, setChartOptions] = useState<ChartOptions<'line'>>(
    getMinimalChartOptions(options) as ChartOptions<'line'>
  );

  useEffect(() => {
    const colors = getThemeColors();
    
    // Apply default colors if not provided
    const updatedData = {
      ...data,
      datasets: data.datasets.map((dataset, index) => ({
        ...dataset,
        borderColor: dataset.borderColor || [colors.primary, colors.success, colors.warning, colors.destructive][index % 4],
        backgroundColor: dataset.backgroundColor || `${[colors.primary, colors.success, colors.warning, colors.destructive][index % 4]}20`,
        tension: dataset.tension ?? 0.3,
        fill: dataset.fill ?? false,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: dataset.borderColor || [colors.primary, colors.success, colors.warning, colors.destructive][index % 4],
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      })),
    };

    setChartData(updatedData);
    setChartOptions(getMinimalChartOptions(options as any) as ChartOptions<'line'>);
  }, [data, options]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Line data={chartData} options={chartOptions as any} />
    </div>
  );
}

// Bar Chart Component
interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
  options?: Partial<ChartOptions<'bar'>>;
  height?: number;
}

export function BarChart({ data, options, height = 300 }: BarChartProps) {
  const [chartData, setChartData] = useState(data);
  const [chartOptions, setChartOptions] = useState<ChartOptions<'bar'>>(
    getMinimalChartOptions(options) as ChartOptions<'bar'>
  );

  useEffect(() => {
    const colors = getThemeColors();
    
    // Apply default colors if not provided
    const updatedData = {
      ...data,
      datasets: data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || [colors.primary, colors.success, colors.warning, colors.destructive][index % 4],
        borderColor: dataset.borderColor || [colors.primary, colors.success, colors.warning, colors.destructive][index % 4],
        borderWidth: 0,
        borderRadius: 4,
      })),
    };

    setChartData(updatedData);
    setChartOptions(getMinimalChartOptions(options as any) as ChartOptions<'bar'>);
  }, [data, options]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Bar data={chartData} options={chartOptions as any} />
    </div>
  );
}

// Pie Chart Component
interface PieChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
  options?: Partial<ChartOptions<'pie'>>;
  height?: number;
}

export function PieChart({ data, options, height = 300 }: PieChartProps) {
  const [chartData, setChartData] = useState(data);
  const [chartOptions, setChartOptions] = useState<ChartOptions<'pie'>>(
    getMinimalChartOptions({
      ...options,
      scales: undefined, // Pie charts don't have scales
    }) as ChartOptions<'pie'>
  );

  useEffect(() => {
    const colors = getThemeColors();
    const defaultColors = [colors.primary, colors.success, colors.warning, colors.destructive, colors.secondary];
    
    // Apply default colors if not provided
    const updatedData = {
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || defaultColors,
        borderColor: dataset.borderColor || Array(data.labels.length).fill('#ffffff'),
        borderWidth: 2,
      })),
    };

    setChartData(updatedData);
    setChartOptions(
      getMinimalChartOptions({
        ...options,
        scales: undefined,
      } as any) as ChartOptions<'pie'>
    );
  }, [data, options]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Pie data={chartData} options={chartOptions as any} />
    </div>
  );
}

// Doughnut Chart Component
interface DoughnutChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
  options?: Partial<ChartOptions<'doughnut'>>;
  height?: number;
}

export function DoughnutChart({ data, options, height = 300 }: DoughnutChartProps) {
  const [chartData, setChartData] = useState(data);
  const [chartOptions, setChartOptions] = useState<ChartOptions<'doughnut'>>(
    getMinimalChartOptions({
      ...options,
      scales: undefined, // Doughnut charts don't have scales
    }) as ChartOptions<'doughnut'>
  );

  useEffect(() => {
    const colors = getThemeColors();
    const defaultColors = [colors.primary, colors.success, colors.warning, colors.destructive, colors.secondary];
    
    // Apply default colors if not provided
    const updatedData = {
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || defaultColors,
        borderColor: dataset.borderColor || Array(data.labels.length).fill('#ffffff'),
        borderWidth: 2,
      })),
    };

    setChartData(updatedData);
    const doughnutOptions: any = {
      ...getMinimalChartOptions({
        ...options,
        scales: undefined,
      } as any),
      cutout: '65%',
    };
    setChartOptions(doughnutOptions as ChartOptions<'doughnut'>);
  }, [data, options]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Doughnut data={chartData} options={chartOptions as any} />
    </div>
  );
}
