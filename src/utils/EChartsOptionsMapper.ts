/**
 * EChartsOptionsMapper - Production-ready wrapper for API-driven ECharts
 * 
 * Optimized for converting Chart.js API responses to ECharts format.
 * Includes security (XSS), validation, and error handling for untrusted API data.
 * 
 * @example Basic usage from API
 * ```typescript
 * // API returns Chart.js format
 * const apiResponse = await fetch('/api/chart').then(r => r.json());
 * const data = EChartsOptionsMapper.fromChartJsData(apiResponse.chartjs);
 * 
 * const options = EChartsOptionsMapper.getOptions('bar', data, { 
 *   colors: ['#4735CD'] 
 * });
 * 
 * if (!options) {
 *   // Handle error - API returned bad data
 *   showError('Failed to generate chart');
 *   return;
 * }
 * 
 * <ReactECharts option={options} />
 * ```
 */

// import type { ChartData } from "./CustomizableChart";

import type { EChartsOption, TooltipComponentOption, LegendComponentOption, GridComponentOption } from "echarts";
export interface ChartData {
  readonly name: string;
  readonly value: number;
  readonly description?: string;
  readonly groupId?: string;
}
// ============================================================================
// Type Definitions - Immutable for better type safety
// ============================================================================

export type ChartType =
  | "bar"
  | "horizontalBar"
  | "line"
  | "areaLine"
  | "pie"
  | "donut"
  | "nightAngle"
  | "stackedBar"
  | "groupedBar"
  | "stackedLine"
  | "waterFall"
  | "stackedWaterFall";

export interface ChartOptions {
  readonly colors?: string[];
  readonly title?: string;
  readonly subtitle?: string;
  readonly showLegend?: boolean;
  readonly legendPosition?: "top" | "bottom" | "left" | "right";
  readonly tooltip?: boolean;
  readonly animation?: boolean;
  readonly grid?: Readonly<GridConfig>;
  readonly theme?: "light" | "dark";
}

export interface GridConfig {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  containLabel?: boolean;
}

export interface MultiSeriesData {
  readonly seriesName: string;
  readonly data: readonly ChartData[];
}

/**
 * Chart factory function type for extensibility
 */
type ChartFactory = (
  data: readonly ChartData[] | readonly MultiSeriesData[],
  options: ChartOptions
) => EChartsOption | null;

/**
 * Validation result for better error handling
 */
interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

// ============================================================================
// Common Configurations - Immutable and frozen for performance
// ============================================================================

const DEFAULT_GRID: Readonly<GridComponentOption> = Object.freeze({
  top: 10,
  left: 20,
  right: 20,
  bottom: 10,
  containLabel: true,
});

const DEFAULT_LEGEND: LegendComponentOption = {
  bottom: 0,
  orient: "horizontal" as const,
  left: "center" as const,
  type: "scroll" as const,
  itemGap: 20,
  pageButtonItemGap: 5,
  pageButtonGap: 5,
  width: "90%",
  padding: [50, 0, 0, 0],
};

const DEFAULT_TOOLTIP: Readonly<TooltipComponentOption> = Object.freeze({
  trigger: "item" as const,
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderColor: "#ccc",
  borderWidth: 1,
  textStyle: { color: "#333" },
});



// ============================================================================
// Main Mapper Class - Enterprise-grade with caching and extensibility
// ============================================================================

export default class EChartsOptionsMapper {
  // Chart factory registry for extensibility (if needed)
  private static readonly chartFactories = new Map<string, ChartFactory>();

  /**
   * Main entry point for generating ECharts options with comprehensive error handling
   * Optimized for API-driven data - no caching since API data is typically dynamic
   * Returns null on error instead of throwing - safer for production
   */
  static getOptions(
    chartType: ChartType,
    data: readonly ChartData[] | readonly MultiSeriesData[],
    options: ChartOptions = {}
  ): EChartsOption | null {
    try {
      // Validate input first (API can return malformed data)
      const validation = this.validateInput(chartType, data);
      if (!validation.isValid) {
        console.error(`Chart validation failed: ${validation.errors.join(', ')}`);
        return null;
      }

      // Check for custom factory (if registered)
      const customFactory = this.chartFactories.get(chartType);
      if (customFactory) {
        return customFactory(data, options);
      }

      // Generate chart options based on type
      switch (chartType) {
        case "bar":
          return this.createBarChart(data as readonly ChartData[], options);
        case "horizontalBar":
          return this.createHorizontalBarChart(data as readonly ChartData[], options);
        case "line":
          return this.createLineChart(data as readonly ChartData[], options);
        case "areaLine":
          return this.createAreaChart(data as readonly ChartData[], options);
        case "pie":
          return this.createPieChart(data as readonly ChartData[], options);
        case "donut":
          return this.createDonutChart(data as readonly ChartData[], options);
        case "nightAngle":
          return this.createNightingaleChart(data as readonly ChartData[], options);
        case "stackedBar":
          return this.createStackedBarChart(data as readonly MultiSeriesData[], options);
        case "groupedBar":
          return this.createGroupedBarChart(data as readonly MultiSeriesData[], options);
        case "stackedLine":
          return this.createStackedLineChart(data as readonly MultiSeriesData[], options);
        default:
          console.warn(`Chart type "${chartType}" not implemented`);
          return null;
      }
    } catch (error) {
      console.error(`Error generating chart options for "${chartType}":`, error);
      return null;
    }
  }

  /**
   * Register a custom chart type - enables extensibility without modifying class
   * Use this if you need chart types beyond the built-in ones
   */
  static registerChartType(type: string, factory: ChartFactory): void {
    this.chartFactories.set(type, factory);
  }

  // ==========================================================================
  // Single Series Charts - Using shared base methods to reduce duplication
  // ==========================================================================

  static createBarChart(data: readonly ChartData[], options: ChartOptions = {}): EChartsOption | null {
    if (!data || data.length === 0) return null;
    
    return this.createXYChart(data, options, {
      type: "bar",
      barMaxWidth: 50,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
    });
  }

  static createHorizontalBarChart(data: readonly ChartData[], options: ChartOptions = {}): EChartsOption | null {
    if (!data || data.length === 0) return null;
    const { colors = [] } = options;
    
    return {
      color: colors as string[],
      grid: this.getGrid(options),
      tooltip: this.getTooltip(data),
      xAxis: { type: "value" },
      yAxis: {
        type: "category",
        data: data.map((d) => d.name),
      },
      series: [{
        type: "bar",
        data: data.map((d) => d.value),
        barMaxWidth: 50,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
      }],
    };
  }

  static createLineChart(data: readonly ChartData[], options: ChartOptions = {}): EChartsOption | null {
    if (!data || data.length === 0) return null;
    
    return this.createXYChart(data, options, {
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      lineStyle: { width: 3 },
    });
  }

  static createAreaChart(data: readonly ChartData[], options: ChartOptions = {}): EChartsOption | null {
    if (!data || data.length === 0) return null;
    
    return this.createXYChart(data, options, {
      type: "line",
      smooth: true,
      areaStyle: { opacity: 0.5 },
      lineStyle: { width: 2 },
    });
  }

  static createPieChart(data: readonly ChartData[], options: ChartOptions = {}): EChartsOption | null {
    if (!data || data.length === 0) return null;
    const { colors = [], showLegend = true } = options;
    
    return {
      color: colors as string[],
      tooltip: this.getPieTooltip(data),
      ...(showLegend && { legend: DEFAULT_LEGEND }),
      series: [{
        type: "pie",
        radius: "60%",
        center: ["50%", "40%"],
        data: [...data],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      }],
    };
  }

  static createDonutChart(data: readonly ChartData[], options: ChartOptions = {}): EChartsOption | null {
    return this.createPieVariant(data, options, { radius: ["40%", "70%"] });
  }

  static createNightingaleChart(data: readonly ChartData[], options: ChartOptions = {}): EChartsOption | null {
    return this.createPieVariant(data, options, { 
      radius: ["20%", "70%"],
      roseType: "area"
    });
  }

  // ==========================================================================
  // Multi-Series Charts - Using shared base to reduce duplication
  // ==========================================================================

  static createStackedBarChart(
    data: readonly MultiSeriesData[],
    options: ChartOptions = {}
  ): EChartsOption | null {
    return this.createMultiSeriesChart(data, options, { type: "bar", stack: "total" });
  }

  static createGroupedBarChart(
    data: readonly MultiSeriesData[],
    options: ChartOptions = {}
  ): EChartsOption | null {
    return this.createMultiSeriesChart(data, options, { type: "bar" });
  }

  static createStackedLineChart(
    data: readonly MultiSeriesData[],
    options: ChartOptions = {}
  ): EChartsOption | null {
    return this.createMultiSeriesChart(data, options, { 
      type: "line", 
      stack: "total",
      smooth: true,
      areaStyle: {}
    });
  }

  // ==========================================================================
  // Shared Base Methods - DRY principle to reduce duplication
  // ==========================================================================

  /**
   * Creates a standard XY chart (bar, line, area)
   */
  private static createXYChart(
    data: readonly ChartData[],
    options: ChartOptions,
    seriesConfig: Record<string, unknown>
  ): EChartsOption {
    const { colors = [], showLegend = false } = options;
    
    return {
      color: colors as string[],
      grid: this.getGrid(options),
      tooltip: this.getTooltip(data),
      ...(showLegend && { legend: DEFAULT_LEGEND }),
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisLabel: { rotate: data.length > 10 ? 45 : 0 },
      },
      yAxis: { type: "value" },
      series: [{
        data: data.map((d) => d.value),
        ...seriesConfig,
      }],
    };
  }

  /**
   * Creates pie chart variants (donut, nightingale)
   */
  private static createPieVariant(
    data: readonly ChartData[],
    options: ChartOptions,
    seriesOverride: Record<string, unknown>
  ): EChartsOption | null {
    const pieOptions = this.createPieChart(data, options);
    if (!pieOptions) return null;
    
    const series = (pieOptions as { series?: Array<Record<string, unknown>> }).series;
    if (series?.[0]) {
      Object.assign(series[0], seriesOverride);
    }
    return pieOptions;
  }

  /**
   * Creates multi-series charts (stacked bar, grouped bar, stacked line)
   */
  private static createMultiSeriesChart(
    data: readonly MultiSeriesData[],
    options: ChartOptions,
    seriesConfig: Record<string, unknown>
  ): EChartsOption | null {
    if (!data || data.length === 0 || !data[0]?.data) return null;
    
    const { colors = [], showLegend = true } = options;
    const categories = data[0]?.data.map((d) => d.name) || [];
    const isBar = seriesConfig.type === "bar";
    
    return {
      color: colors as string[],
      grid: this.getGrid(options),
      tooltip: {
        trigger: "axis",
        ...(isBar && { axisPointer: { type: "shadow" } }),
      },
      ...(showLegend && { legend: DEFAULT_LEGEND }),
      xAxis: {
        type: "category",
        data: categories,
      },
      yAxis: { type: "value" },
      series: data.map((series) => ({
        name: series.seriesName,
        data: series.data.map((d) => d.value),
        ...(isBar && { barMaxWidth: seriesConfig.stack ? 50 : 30 }),
        ...seriesConfig,
      })),
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private static getGrid(options: ChartOptions): GridComponentOption {
    return {
      ...DEFAULT_GRID,
      ...options.grid,
    };
  }

  private static getTooltip(data: readonly ChartData[]): TooltipComponentOption {
    return {
      ...DEFAULT_TOOLTIP,
      trigger: "item" as const,
      formatter: (params: unknown) => {
        if (!params || typeof params !== 'object') return '';
        const p = params as { name?: string; value?: number; percent?: number };
        if (!p.name) return '';
        
        const item = data.find((d) => d.name === p.name);
        const value = typeof p.value === 'number' ? p.value.toLocaleString() : String(p.value || '');
        const percentStr = p.percent ? ` (${p.percent}%)` : '';
        
        return `
          <strong>${this.escapeHtml(p.name)}</strong><br/>
          Value: ${value}${percentStr}<br/>
          ${item?.description ? this.escapeHtml(item.description) : ""}
        `.trim();
      },
    };
  }

  /**
   * Specialized tooltip for pie charts (reuses getTooltip but kept for clarity)
   */
  private static getPieTooltip(data: readonly ChartData[]): TooltipComponentOption {
    return this.getTooltip(data);
  }

  /**
   * Escape HTML to prevent XSS attacks in tooltips
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Comprehensive validation with detailed error reporting
   */
  private static validateInput(
    chartType: ChartType,
    data: readonly ChartData[] | readonly MultiSeriesData[]
  ): ValidationResult {
    const errors: string[] = [];

    if (!data) {
      errors.push("Data is null or undefined");
      return { isValid: false, errors };
    }

    if (!Array.isArray(data)) {
      errors.push("Data must be an array");
      return { isValid: false, errors };
    }

    if (data.length === 0) {
      errors.push("Data array is empty");
      return { isValid: false, errors };
    }

    const multiSeriesCharts: readonly ChartType[] = ["stackedBar", "groupedBar", "stackedLine"];
    const isMultiSeries = multiSeriesCharts.includes(chartType);

    if (isMultiSeries) {
      const multiData = data as readonly MultiSeriesData[];
      multiData.forEach((series, index) => {
        if (!series.seriesName) {
          errors.push(`Series at index ${index} is missing seriesName`);
        }
        if (!Array.isArray(series.data)) {
          errors.push(`Series at index ${index} has invalid data (not an array)`);
        } else if (series.data.length === 0) {
          errors.push(`Series "${series.seriesName}" has empty data array`);
        }
      });
    } else {
      const singleData = data as readonly ChartData[];
      singleData.forEach((item, index) => {
        if (item.name === undefined || item.name === null) {
          errors.push(`Data item at index ${index} is missing name`);
        }
        if (item.value === undefined || item.value === null) {
          errors.push(`Data item at index ${index} is missing value`);
        }
        if (typeof item.value === 'number' && !isFinite(item.value)) {
          errors.push(`Data item at index ${index} has invalid value (NaN or Infinity)`);
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Converts Chart.js data format to ECharts format with proper type safety
   * Useful for migrating from Chart.js to ECharts
   */
  static fromChartJsData(chartJsData: unknown): readonly ChartData[] {
    if (!chartJsData || typeof chartJsData !== 'object') {
      console.warn('Invalid Chart.js data format');
      return [];
    }

    const data = chartJsData as {
      labels?: unknown[];
      datasets?: Array<{ data?: unknown[] }>;
    };

    if (!Array.isArray(data.labels) || 
        !Array.isArray(data.datasets) ||
        data.datasets.length === 0 ||
        !Array.isArray(data.datasets[0]?.data)) {
      console.warn('Chart.js data missing required structure');
      return [];
    }

    const firstDataset = data.datasets[0];
    if (!firstDataset || !firstDataset.data) {
      return [];
    }

    return data.labels
      .map((label, index) => {
        const value = firstDataset.data![index];
        if (typeof label !== 'string' && typeof label !== 'number') return null;
        if (typeof value !== 'number') return null;
        
        return {
          name: String(label),
          value: value,
        };
      })
      .filter((item): item is ChartData => item !== null);
  }

  /**
   * Deep clone chart options to prevent mutations
   */
  static cloneOptions(options: EChartsOption): EChartsOption {
    return JSON.parse(JSON.stringify(options));
  }

  /**
   * Merge multiple chart options (useful for composing complex charts)
   */
  static mergeOptions(...options: readonly EChartsOption[]): EChartsOption {
    return options.reduce((acc, opt) => ({ ...acc, ...opt }), {});
  }
}

// ============================================================================
// Usage Examples for API-Driven Charts
// ============================================================================

/**
 * @example Converting Chart.js API response to ECharts
 * ```typescript
 * // Your API returns Chart.js format like in sample data
 * const response = await fetch('/api/chart').then(r => r.json());
 * 
 * // Convert Chart.js data to ECharts format
 * const data = EChartsOptionsMapper.fromChartJsData(response.chartjs);
 * 
 * // Generate ECharts options
 * const options = EChartsOptionsMapper.getOptions('bar', data, { 
 *   colors: ['#4735CD', '#DF5982'] 
 * });
 * 
 * if (!options) {
 *   console.error('API returned invalid data');
 *   return <ErrorState />;
 * }
 * 
 * return <ReactECharts option={options} />;
 * ```
 * 
 * @example Handling API errors gracefully
 * ```typescript
 * try {
 *   const response = await fetch('/api/chart');
 *   if (!response.ok) throw new Error('API error');
 *   
 *   const json = await response.json();
 *   const data = EChartsOptionsMapper.fromChartJsData(json.chartjs);
 *   const options = EChartsOptionsMapper.getOptions('pie', data, { colors });
 *   
 *   if (!options) {
 *     // Validation failed - show user-friendly message
 *     return <ChartError message="Unable to display chart data" />;
 *   }
 *   
 *   return <ReactECharts option={options} />;
 * } catch (error) {
 *   return <ChartError message="Failed to load chart" />;
 * }
 * ```
 * 
 * @example Multi-series from API (if your API supports it)
 * ```typescript
 * const multiData = [
 *   { seriesName: "2023", data: apiData.series1 },
 *   { seriesName: "2024", data: apiData.series2 }
 * ];
 * 
 * const options = EChartsOptionsMapper.getOptions('stackedBar', multiData, { 
 *   colors: ['#4735CD', '#DF5982'],
 *   showLegend: true 
 * });
 * ```
 * 
 * Key Points for API Data:
 * - Always check if options is null (API can return bad data)
 * - Use fromChartJsData() for Chart.js format conversion
 * - XSS protection is built-in for user-generated content
 * - Validation catches malformed API responses
 */
