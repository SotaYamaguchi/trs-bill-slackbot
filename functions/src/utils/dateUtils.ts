// Set timezone
import dayjs from "dayjs";

const japanLocaleString = new Date().toLocaleString("ja-JP", {
  timeZone: "Asia/Tokyo"
});

const localeNow = (): dayjs.Dayjs => {
  return dayjs(new Date(japanLocaleString));
};

const isDate = (value: string) => {
  return dayjs(value).isValid;
};

const formatMD = (value: string) => {
  return dayjs(value).format('M/D');
};

const formatYYYYM = (value: string) => {
  return dayjs(value).format('YYYY年M月');
};

export {
  localeNow,
  isDate,
  formatMD,
  formatYYYYM
};
