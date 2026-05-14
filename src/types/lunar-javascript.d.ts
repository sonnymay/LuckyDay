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
    /** Numeric lunar month, 1-12 */
    getMonth(): number;
    /** Numeric lunar day, 1-30 */
    getDay(): number;
    /** Solar term (节气) name if today is one, otherwise empty string */
    getJieQi(): string;
    /**
     * The day-god (天神) name in Chinese for today, one of 12 possible:
     * 青龙 明堂 金匮 天德 玉堂 司命 (auspicious / 黄道) or
     * 天刑 朱雀 白虎 天牢 玄武 勾陈 (inauspicious / 黑道).
     */
    getDayTianShen(): string;
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
