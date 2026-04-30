declare module 'lunar-javascript' {
  interface LunarDate {
    /** 宜 — auspicious activities for this day, in Chinese */
    getDayYi(): string[];
    /** 忌 — inauspicious activities for this day, in Chinese */
    getDayJi(): string[];
    /** Chinese lunar month name, e.g. "三" */
    getMonthInChinese(): string;
    /** Chinese lunar day name, e.g. "初三" */
    getDayInChinese(): string;
    /** Solar term (节气) name if today is one, otherwise empty string */
    getJieQi(): string;
  }

  interface SolarDate {
    getLunar(): LunarDate;
  }

  interface SolarConstructor {
    fromYmd(year: number, month: number, day: number): SolarDate;
  }

  const Lunar: {
    Solar: SolarConstructor;
  };

  export default Lunar;
}
