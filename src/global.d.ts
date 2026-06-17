// global types

// 百度地图GL版本全局类型声明
/// <reference types="bmapgl" />

// Pendo analytics global
declare const pendo: {
  track(eventName: string, properties?: Record<string, unknown>): void;
} | undefined;
