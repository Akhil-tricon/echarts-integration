import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Observable } from 'rxjs';
import { createChartStream } from '../services/StreamParser';
import EChartsOptionsMapper from '../utils/EChartsOptionsMapper';

interface Props {
  lineStream$: Observable<string>;
}

const ChartStreamer: React.FC<Props> = ({ lineStream$ }) => {
  const [options, setOptions] = useState<any>(null);

  useEffect(() => {
    const subscription = createChartStream(lineStream$).subscribe(parsed => {
      if (parsed) {
        // Here we map the Chart.js type to your Mapper's ChartType
        const typeMap: Record<string, any> = {
          'bar': 'bar',
          'line': 'line',
          'pie': 'pie',
          'doughnut': 'donut'
        };

        // Default color palette
        const defaultColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

        const chartOptions = EChartsOptionsMapper.getOptions(
          typeMap[parsed.type] || 'bar',
          parsed.data,
          {
            colors: defaultColors,
            showLegend: true,
            title: parsed.originalOptions?.plugins?.title?.text,
            grid: { bottom: 80, containLabel: true }
          }
        );
        
        setOptions(chartOptions);
      }
    });

    return () => subscription.unsubscribe();
  }, [lineStream$]);

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
      {options ? (
        <ReactECharts option={options} style={{ height: '500px' }} />
      ) : (
        <p>Waiting for Stream...</p>
      )}
    </div>
  );
};

export default ChartStreamer;