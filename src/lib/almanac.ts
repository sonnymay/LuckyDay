/**
 * almanac.ts
 *
 * Pulls real daily 宜 (Yi / appropriate) and 忌 (Ji / avoid) data from the
 * traditional Chinese almanac (通勝 Tung Shing) via the lunar-javascript
 * library, which implements the same calendar tables used in printed almanacs
 * sold across Asia every year.
 *
 * goodFor and avoid in the daily reading are no longer random picks — they are
 * the genuine almanac activities for that calendar day, translated to English.
 */
import Lunar from 'lunar-javascript';

// ─── Translation tables ───────────────────────────────────────────────────────

/** 宜 (Yi) — activities the almanac considers auspicious today */
const YI_EN: Record<string, string> = {
  '祭祀': 'Ritual & prayer',
  '祈福': 'Setting intentions',
  '出行': 'Travel & new places',
  '嫁娶': 'Love & relationships',
  '纳采': 'New connections',
  '问名': 'Making introductions',
  '进人口': 'Welcoming new people',
  '开市': 'Business & money',
  '交易': 'Deals & negotiations',
  '纳财': 'Welcoming wealth',
  '开仓': 'Abundance & receiving',
  '动土': 'Starting new projects',
  '修造': 'Building & creating',
  '上梁': 'Celebrating milestones',
  '安床': 'Rest & restoration',
  '沐浴': 'Self-care & cleansing',
  '剃头': 'Fresh starts',
  '整手足甲': 'Self-care rituals',
  '解除': 'Releasing negativity',
  '破土': 'Big life changes',
  '破屋': 'Letting go',
  '迁徙': 'Major transitions',
  '栽种': 'Planting new seeds',
  '牧养': 'Nurturing & caring',
  '纳畜': 'Receiving abundance',
  '普渡': 'Generosity & giving',
  '开光': 'Blessing new things',
  '塑绘': 'Creative work',
  '求嗣': 'New beginnings',
  '立券': 'Agreements & contracts',
  '捕鱼': 'Patience & deep focus',
  '畋猎': 'Strategy & planning',
  '结网': 'Building your network',
  '扫舍宇': 'Clearing your space',
  '扫舍': 'Clearing your space',
  '放水': 'Going with the flow',
  '修仓库': 'Organizing & clearing',
  '求医疗病': 'Health & healing',
  '乘船': 'New ventures',
  '造船': 'Planning ahead',
  '修坟': 'Honoring your roots',
};

/** 忌 (Ji) — activities the almanac considers inauspicious today */
const JI_EN: Record<string, string> = {
  '嫁娶': 'Love commitments',
  '动土': 'Starting big projects',
  '开市': 'Large financial decisions',
  '出行': 'Long-distance travel',
  '安葬': 'Difficult closures',
  '修造': 'Major renovations',
  '破土': 'Major life upheaval',
  '纳财': 'Large purchases',
  '交易': 'Signing contracts',
  '立券': 'Making big agreements',
  '祭祀': 'Ceremonies & rituals',
  '安床': 'Moving furniture',
  '迁徙': 'Moving home',
  '沐浴': 'Intense cleansing',
  '解除': 'Releasing control',
  '栽种': 'Starting new habits',
  '求医疗病': 'Elective procedures',
  '针刺': 'Medical treatments',
  '伐木': 'Heavy physical labor',
  '行丧': 'Difficult conversations',
  '祈福': 'New spiritual commitments',
  '开光': 'Making promises',
  '纳采': 'New relationships',
};

/** 24 Solar Terms (二十四节气) — bilingual display */
const SOLAR_TERM_EN: Record<string, string> = {
  '小寒': 'Minor Cold',
  '大寒': 'Major Cold',
  '立春': 'Start of Spring',
  '雨水': 'Rain Water',
  '惊蛰': 'Awakening of Insects',
  '春分': 'Spring Equinox',
  '清明': 'Clear & Bright',
  '谷雨': 'Grain Rain',
  '立夏': 'Start of Summer',
  '小满': 'Grain Buds',
  '芒种': 'Grain in Ear',
  '夏至': 'Summer Solstice',
  '小暑': 'Minor Heat',
  '大暑': 'Major Heat',
  '立秋': 'Start of Autumn',
  '处暑': 'End of Heat',
  '白露': 'White Dew',
  '秋分': 'Autumnal Equinox',
  '寒露': 'Cold Dew',
  '霜降': "Frost's Descent",
  '立冬': 'Start of Winter',
  '小雪': 'Minor Snow',
  '大雪': 'Major Snow',
  '冬至': 'Winter Solstice',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlmanacDay = {
  /** Lunar calendar date in Chinese, e.g. "三月初三" */
  lunarDate: string;
  /**
   * Bilingual solar term label if today falls on one of the 24 节气,
   * e.g. "谷雨 · Grain Rain". Undefined on ordinary days.
   */
  solarTerm: string | undefined;
  /** Translated 宜 activities — auspicious for today */
  goodFor: string[];
  /** Translated 忌 activities — inauspicious for today */
  avoid: string[];
};

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns the real Chinese almanac data for a given Gregorian date.
 * Falls back gracefully if the library fails for any reason.
 */
export function getAlmanacDay(date: Date): AlmanacDay {
  try {
    const solar = Lunar.Solar.fromYmd(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    );
    const lunar = solar.getLunar();

    // Translate 宜 list — take up to 3 that have English mappings
    const goodFor = (lunar.getDayYi() as string[])
      .map((item) => YI_EN[item])
      .filter((item): item is string => item !== undefined)
      .slice(0, 3);

    // Translate 忌 list — take up to 3 that have English mappings
    const avoid = (lunar.getDayJi() as string[])
      .map((item) => JI_EN[item])
      .filter((item): item is string => item !== undefined)
      .slice(0, 3);

    // Lunar calendar date string, e.g. "三月初三"
    const lunarDate = `${lunar.getMonthInChinese() as string}月${lunar.getDayInChinese() as string}`;

    // Solar term (节气) if today is one
    const rawJieQi = lunar.getJieQi() as string;
    const solarTerm = rawJieQi
      ? `${rawJieQi} · ${SOLAR_TERM_EN[rawJieQi] ?? rawJieQi}`
      : undefined;

    return {
      lunarDate,
      solarTerm,
      goodFor: goodFor.length > 0 ? goodFor : ['Quiet reflection', 'Rest'],
      avoid: avoid.length > 0 ? avoid : ['Rushing decisions'],
    };
  } catch {
    // Graceful fallback — the app still works even if the library errors
    return {
      lunarDate: '',
      solarTerm: undefined,
      goodFor: ['Quiet reflection', 'Rest'],
      avoid: ['Rushing decisions'],
    };
  }
}
