import React, { useMemo, useState } from 'react';
import { Subject, from, timer } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import ChartStreamer from './components/ChartStreamer';

// Sample chart data files
const SAMPLE_FILES: Record<string, string> = {
  bar: 'bar_chart_with_response.txt',
  pie: 'pie_chart_with_response.txt',
  line: 'line_chart_with_response.txt',
  area: 'area_chart_with_response.txt',
  doughnut: 'doughnut_chart_with_response.txt',
};

export default function App() {
  const input$ = useMemo(() => new Subject<string>(), []);
  const [selectedChart, setSelectedChart] = useState<string>('bar');
  const [loading, setLoading] = useState(false);

  const loadAndStreamFile = async (filename: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/sample data/${filename}`);
      const content = await response.text();
      
      // Stream line by line with delay to simulate SSE
      from(content.split('\n'))
        .pipe(concatMap(line => timer(50).pipe(map(() => line))))
        .subscribe({
          next: line => input$.next(line),
          complete: () => setLoading(false),
          error: err => {
            console.error('Stream error:', err);
            setLoading(false);
          }
        });
    } catch (error) {
      console.error('Failed to load file:', error);
      setLoading(false);
    }
  };

  const runSimulation = () => {
    const filename = SAMPLE_FILES[selectedChart];
    if (filename) {
      loadAndStreamFile(filename);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Enterprise ECharts Integration</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>Chart Type:</label>
        <select 
          value={selectedChart} 
          onChange={(e) => setSelectedChart(e.target.value)}
          style={{ padding: '8px 12px', fontSize: '14px' }}
        >
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="line">Line Chart</option>
          <option value="area">Area Chart</option>
          <option value="doughnut">Doughnut Chart</option>
        </select>
        
        <button 
          onClick={runSimulation} 
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Loading...' : 'Load Chart from Sample Data'}
        </button>
      </div>
      
      <ChartStreamer lineStream$={input$} />
    </div>
  );
}