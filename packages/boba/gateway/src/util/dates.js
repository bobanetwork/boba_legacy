import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/en'; // or the locale of your choice

dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

export const Now = () => {
  return dayjs();
};

export const formatDate = (date, format = 'MM/DD/YYYY hh:mm a') => {
  return dayjs.unix(date).format(format);
};

export const convertDate = (date, format) => {
  return format ? dayjs(date).format(format) : dayjs(date);
};

export const isSameOrAfterDate = (dateA, dateB) => {
  return dayjs.unix(dateA).isSameOrAfter(dateB);
};

export const isSameOrBeforeDate = (dateA, dateB) => {
  return dayjs.unix(dateA).isSameOrBefore(dateB);
};

export const isAfterDate = (date) => {
  return dayjs().isAfter(dayjs.unix(date));
};

export const addDays = (date, days, format) => {
  return format ? dayjs(date).add(days, 'days').format(format) : dayjs(date).add(days, 'days');
};

export const addMonths = (date, months, format) => {
  return format ? dayjs(date).add(months, 'months').format(format) : dayjs(date).add(months, 'months');
};

export const addYear = (year, format) => {
  return format ? dayjs().add(year, 'year').format(format) : dayjs().add(year, 'year');
};

export const isSameMonth = (date) => {
  return dayjs(date).isSame(Now(), 'month');
};

export const isSameWeek = (date) => {
  return dayjs(date).isSame(Now(), 'week');
};

export const isBeforeDate = (date) => {
  return dayjs(date).isBefore(Now());
};