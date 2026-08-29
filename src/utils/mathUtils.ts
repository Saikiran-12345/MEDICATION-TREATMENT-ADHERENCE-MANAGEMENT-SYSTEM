// ============================================================
// Mathematical and Statistical Utilities
// Statistics, moving averages, linear regressions, clamps, and conversions.
// ============================================================

/**
 * Calculate the arithmetic mean of an array of numbers.
 */
export function mean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return sum(values) / values.length;
}

/**
 * Calculate the median of an array of numbers.
 */
export function median(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate the mode(s) of an array of numbers.
 * Returns an array containing the modes (since there can be multiple).
 */
export function mode(values: number[]): number[] {
  if (!values || values.length === 0) return [];
  const counts: Record<number, number> = {};
  let maxCount = 0;
  
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > maxCount) {
      maxCount = counts[v];
    }
  }

  const modes: number[] = [];
  for (const key in counts) {
    if (counts[key] === maxCount) {
      modes.push(Number(key));
    }
  }
  return modes;
}

/**
 * Calculate the variance of an array of numbers.
 */
export function variance(values: number[]): number {
  if (!values || values.length <= 1) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  return sum(squaredDiffs) / (values.length - 1); // Sample variance
}

/**
 * Calculate the standard deviation of an array of numbers.
 */
export function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * Calculate a percentile of an array of numbers.
 * p is between 0 and 100 inclusive.
 */
export function percentile(values: number[], p: number): number {
  if (!values || values.length === 0) return 0;
  if (p <= 0) return min(values);
  if (p >= 100) return max(values);

  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Get the minimum value in an array.
 */
export function min(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return Math.min(...values);
}

/**
 * Get the maximum value in an array.
 */
export function max(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * Sum an array of numbers.
 */
export function sum(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Calculate the range (max - min) of an array of numbers.
 */
export function range(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return max(values) - min(values);
}

/**
 * Calculate a simple moving average of a data series.
 */
export function movingAverage(values: number[], window: number): number[] {
  if (!values || values.length === 0 || window <= 0) return [];
  const result: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = values.slice(start, i + 1);
    result.push(mean(subset));
  }
  return result;
}

/**
 * Perform simple linear regression to fit a line (y = slope * x + intercept)
 * and calculate the coefficient of determination (r2).
 */
export function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = points.length;
  if (n <= 1) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }

  const slopeNumerator = n * sumXY - sumX * sumY;
  const slopeDenominator = n * sumXX - sumX * sumX;

  if (slopeDenominator === 0) {
    return { slope: 0, intercept: sumY / n, r2: 0 };
  }

  const slope = slopeNumerator / slopeDenominator;
  const intercept = (sumY - slope * sumX) / n;

  // R^2 calculation
  const yMean = sumY / n;
  let totalSumSquares = 0;
  let residualSumSquares = 0;

  for (const p of points) {
    const predictedY = slope * p.x + intercept;
    totalSumSquares += Math.pow(p.y - yMean, 2);
    residualSumSquares += Math.pow(p.y - predictedY, 2);
  }

  const r2 = totalSumSquares === 0 ? 1 : 1 - (residualSumSquares / totalSumSquares);

  return { slope, intercept, r2 };
}

/**
 * Calculate the Pearson correlation coefficient between two variables.
 */
export function correlationCoefficient(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n <= 1) return 0;

  const meanX = mean(xs.slice(0, n));
  const meanY = mean(ys.slice(0, n));

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = xs[i] - meanX;
    const diffY = ys[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  if (denomX === 0 || denomY === 0) return 0;
  return numerator / Math.sqrt(denomX * denomY);
}

/**
 * Restrict a value within the bounds of min and max.
 */
export function clamp(value: number, minVal: number, maxVal: number): number {
  return Math.min(Math.max(value, minVal), maxVal);
}

/**
 * Round a number to a specified number of decimal places.
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate percentage.
 */
export function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Interpolate linearly between a start and end value.
 */
export function interpolate(start: number, end: number, factor: number): number {
  return start + (end - start) * clamp(factor, 0, 1);
}

/**
 * Normalize a value relative to a min/max range, returning a factor between 0 and 1.
 */
export function normalize(value: number, minVal: number, maxVal: number): number {
  if (maxVal === minVal) return 0;
  return clamp((value - minVal) / (maxVal - minVal), 0, 1);
}
