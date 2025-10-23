import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { envConfigs } from '@Src/core/infrastructure/get-configs';

// Load plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const TIMEZONE = envConfigs.getConfigs().localTimezone;

export const dateOnTimezone = (
  date: Dayjs | Date | null = null,
  normalize = true,
  timezone = TIMEZONE,
): Dayjs => {
  const dayjsInstance = getDayjsInstanceFromDate(date);
  if (normalize) {
    return dayjsInstance.tz(timezone).minute(0).second(0).millisecond(0);
  }
  return dayjsInstance.tz(timezone);
};

export const getDayjsInstanceFromDate = (date: Dayjs | Date | null): Dayjs => {
  if (dayjs.isDayjs(date)) {
    return date.clone();
  }
  return dayjs(date ?? undefined);
};

export const getDiffInUnit = (
  initDate: Dayjs | Date,
  finalDate: Dayjs | Date,
  unit: dayjs.UnitType = 'second',
  withDecimals = false,
): number => {
  const start = getDayjsInstanceFromDate(initDate);
  const end = getDayjsInstanceFromDate(finalDate);
  return start.diff(end, unit, withDecimals);
};

export const sameOrAfterCurrentTime = (date: Dayjs | Date): boolean => {
  const dayjsInstance = getDayjsInstanceFromDate(date);
  return dayjsInstance.isSameOrAfter(dayjs());
};

export const startOfDate = (date: Dayjs | Date, unit: dayjs.OpUnitType): Dayjs => {
  const dayjsInstance = getDayjsInstanceFromDate(date);
  return dayjsInstance.startOf(unit);
};

export const getNextMondayFromDate = (date: Dayjs | Date): Dayjs => {
  const dayjsInstance = getDayjsInstanceFromDate(date);
  if (dayjsInstance.day() === 0) return dayjsInstance.add(1, 'day');
  return dayjsInstance.add(7 - dayjsInstance.day() + 1, 'day');
};

export const getNextMonthStartDate = (date: Dayjs | Date): Dayjs => {
  const dayjsInstance = getDayjsInstanceFromDate(date);
  const nextMonthStartDay = dayjsInstance.clone().add(1, 'month').startOf('month');
  const diffInDays = nextMonthStartDay.diff(dayjsInstance, 'day');
  const nextMonthStartDate = dayjsInstance.add(diffInDays + 1, 'day');
  return nextMonthStartDate;
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date.toISOString());
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date): Date => {
  const d = new Date(date.toISOString());
  d.setHours(23, 59, 59, 999);
  return d;
};

// number of week of the year (1-53)
export const getWeekNumber = (date: Date): number => {
  const d = new Date(date.toISOString());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  return Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
};
