import dayjs, {Dayjs} from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/en'; // or the locale of your choice

dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

export {Dayjs}

export const Now = () => {
  return dayjs();
};

type DateFormatType = (date: number, format?: string) => string;
export const formatDate: DateFormatType = (date, format = 'MM/DD/YYYY hh:mm a') => {
  return dayjs.unix(date).format(format);
};

type ConvertDateType = (date: string | Date | Dayjs, format?: string) => string | Dayjs;
export const convertDate: ConvertDateType = (date, format) => {
  return format ? dayjs(date).format(format) : dayjs(date);
};

type IsSameAfterOrBeforeDateType = (dateA: number, dateB: Dayjs) => boolean;
export const isSameOrAfterDate: IsSameAfterOrBeforeDateType = (dateA, dateB) => {
  return dayjs.unix(dateA).isSameOrAfter(dateB);
};

export const isSameOrBeforeDate:IsSameAfterOrBeforeDateType = (dateA, dateB) => {
  return dayjs.unix(dateA).isSameOrBefore(dateB);
};

type IsAfterDateType = (date: number) => boolean;
export const isAfterDate:IsAfterDateType = (date) => {
  return dayjs().isAfter(dayjs.unix(date));
};

type AddDaysType = (date: string | number | Date | Dayjs, days: number, format?: string) => string | Dayjs;
export const addDays:AddDaysType = (date, days, format) => {
  return format ? dayjs(date).add(days, 'days').format(format) : dayjs(date).add(days, 'days');
};

type AddMonthsType = (date: string | number | Date | Dayjs, months: number, format?: string) => string | Dayjs;
export const addMonths:AddMonthsType = (date, months, format) => {
  return format ? dayjs(date).add(months, 'months').format(format) : dayjs(date).add(months, 'months');
};

type AddYearType = (year: number, format?: string) => string | Dayjs;
export const addYear:AddYearType = (year, format) => {
  return format ? dayjs().add(year, 'year').format(format) : dayjs().add(year, 'year');
};

type IsSameMonthOrWeekType = (date: string | number | Date) => boolean;
export const isSameMonth:IsSameMonthOrWeekType = (date) => {
  return dayjs(date).isSame(Now(), 'month');
};

export const isSameWeek:IsSameMonthOrWeekType = (date) => {
  return dayjs(date).isSame(Now(), 'week');
};

type isBeforeDateType = (date: string | number | Date) => boolean;
export const isBeforeDate:isBeforeDateType = (date) => {
  return dayjs(date).isBefore(Now());
};