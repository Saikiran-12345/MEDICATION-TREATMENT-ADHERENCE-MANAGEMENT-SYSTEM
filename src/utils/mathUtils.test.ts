import { describe, it, expect } from 'vitest';
import {
  mean,
  median,
  mode,
  variance,
  standardDeviation,
  percentile,
  min,
  max,
  sum,
  range,
  movingAverage,
  linearRegression,
  correlationCoefficient,
  clamp,
  roundTo,
  percentage,
  interpolate,
  normalize,
} from './mathUtils';

describe('mathUtils', () => {
  const numbers = [2, 4, 4, 4, 5, 5, 7, 9];

  it('should calculate mean', () => {
    expect(mean(numbers)).toBe(5);
  });

  it('should calculate median', () => {
    expect(median(numbers)).toBe(4.5);
  });

  it('should calculate mode', () => {
    expect(mode(numbers)).toEqual([4]);
  });

  it('should calculate min and max', () => {
    expect(min(numbers)).toBe(2);
    expect(max(numbers)).toBe(9);
  });

  it('should calculate sum', () => {
    expect(sum(numbers)).toBe(40);
  });

  it('should calculate range', () => {
    expect(range(numbers)).toBe(7);
  });

  it('should calculate variance and standard deviation', () => {
    // sample variance of numbers: 4.5714
    expect(variance(numbers)).toBeCloseTo(4.5714, 4);
    expect(standardDeviation(numbers)).toBeCloseTo(2.138, 3);
  });

  it('should calculate percentile', () => {
    expect(percentile(numbers, 50)).toBe(4.5);
    expect(percentile(numbers, 90)).toBe(7.6);
  });

  it('should calculate moving average', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([1, 1.5, 2, 3, 4]);
  });

  it('should calculate linear regression and Pearson correlation', () => {
    const points = [
      { x: 1, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 5 },
      { x: 4, y: 4 },
      { x: 5, y: 6 },
    ];
    const { slope, intercept } = linearRegression(points);
    expect(slope).toBeCloseTo(0.9, 1);
    expect(intercept).toBeCloseTo(1.3, 1);

    const corr = correlationCoefficient([1, 2, 3, 4, 5], [2, 3, 5, 4, 6]);
    expect(corr).toBeCloseTo(0.9, 1);
  });

  it('should clamp values', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should round numbers', () => {
    expect(roundTo(1.23456, 2)).toBe(1.23);
    expect(roundTo(1.23456, 3)).toBe(1.235);
  });

  it('should calculate percentage', () => {
    expect(percentage(20, 50)).toBe(40);
  });

  it('should interpolate linearly', () => {
    expect(interpolate(0, 100, 0.5)).toBe(50);
  });

  it('should normalize values', () => {
    expect(normalize(50, 0, 100)).toBe(0.5);
  });
});
