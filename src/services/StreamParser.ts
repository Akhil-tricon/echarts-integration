import { Observable } from 'rxjs';
import { scan, filter, map } from 'rxjs/operators';
import EChartsOptionsMapper from '../utils/EChartsOptionsMapper';

export interface StreamState {
  isChartEvent: boolean;
  payload: string;
  ready: boolean;
  isAccumulating: boolean;
  braceCount: number;
}

export const createChartStream = (input$: Observable<string>) => {
  return input$.pipe(
    scan((acc: StreamState, line: string) => {
      const trimmed = line.trim();
      
      // Reset state if we encounter any non-chartjs event
      if (trimmed.startsWith('event:') && !trimmed.startsWith('event: chartjs')) {
        return { isChartEvent: false, payload: '', ready: false, isAccumulating: false, braceCount: 0 };
      }
      
      // Look for the SSE event type we care about
      if (trimmed === 'event: chartjs') {
        return { isChartEvent: true, ready: false, payload: '', isAccumulating: false, braceCount: 0 };
      }
      
      // Only process data if we're in a chartjs event
      if (!acc.isChartEvent && !acc.isAccumulating) {
        return acc;
      }
      
      // Start capturing JSON data (may be multi-line)
      if (acc.isChartEvent && trimmed.startsWith('data:')) {
        const jsonStr = trimmed.substring(5).trim(); // Remove 'data:' prefix
        
        // If the data line is just "data: {" or similar, start accumulating
        if (jsonStr) {
          const openBraces = (jsonStr.match(/{/g) || []).length;
          const closeBraces = (jsonStr.match(/}/g) || []).length;
          const braceCount = openBraces - closeBraces;
          
          // Check if JSON is complete on one line
          if (braceCount === 0 && openBraces > 0) {
            return { isChartEvent: false, payload: jsonStr, ready: true, isAccumulating: false, braceCount: 0 };
          }
          
          // Start accumulating multi-line JSON
          return { isChartEvent: false, payload: jsonStr, isAccumulating: true, braceCount, ready: false };
        }
      }
      
      // Continue accumulating JSON lines
      if (acc.isAccumulating && trimmed) {
        const newPayload = acc.payload + trimmed;
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        const newBraceCount = acc.braceCount + openBraces - closeBraces;
        
        // Check if JSON is complete
        if (newBraceCount === 0) {
          return { isChartEvent: false, payload: newPayload, ready: true, isAccumulating: false, braceCount: 0 };
        }
        
        return { ...acc, payload: newPayload, braceCount: newBraceCount };
      }
      
      return acc;
    }, { isChartEvent: false, payload: '', ready: false, isAccumulating: false, braceCount: 0 }),
    filter(state => state.ready),
    map(state => {
      try {
        const raw = JSON.parse(state.payload);
        
        // Using your Mapper's static method to convert format
        const unifiedData = EChartsOptionsMapper.fromChartJsData(raw.chartjs.data);
        
        // Returning both to the UI
        return { 
          type: raw.chartjs.type, 
          data: unifiedData,
          originalOptions: raw.chartjs.options 
        };
      } catch (e) {
        console.error("Parse Error", e);
        return null;
      }
    }),
    filter(res => res !== null)
  );
};