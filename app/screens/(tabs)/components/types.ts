import React from 'react';

// Common types for dashboard components
export interface Option {
  id: string;
  label: string;
  value: string;
}

export interface HierarchyUnit {
  id: number;
  Name?: string;
  name?: string;
  level: number;
  parent_id?: number;
  zaili_unit_hierarchy?: number[];
}

export interface ScheduleItem {
  eventName: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  type: string;
}

export interface Stat {
  label: string;
  value: string;
}

export interface IconProps {
  style?: any;
  name?: string;
}