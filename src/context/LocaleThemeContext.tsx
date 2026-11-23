import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Locale = 'en' | 'am';
export type ThemeMode = 'dark' | 'light';

const DICTIONARY = {
  en: {
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.tournaments': 'Tournaments',
    'nav.rankings': 'Rankings',
    'nav.players': 'Find Players',
    'nav.communities': 'Communities',
    'nav.about': 'About Us',
    'nav.connection': 'Connection Checker',
    'nav.opportunities': 'Sponsorships & Opportunities',
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Log In',
    'nav.signup': 'Sign Up',
    'nav.logout': 'Log Out',
    'nav.admin': 'Admin Console',
    'nav.legal': 'Fair Play & Legal',
    'hero.eyebrow': 'Ethiopia & Pan-African Esports Infrastructure',
    'hero.title': 'THE FUTURE OF AFRICAN ESPORTS STARTS WITH CONNECTION.',
    'hero.desc':
      'Discover teammates, compete in tournaments, build gaming communities, and unlock opportunities in the growing esports ecosystem.',
    'hero.ctaExplore': 'Explore GameBridge',
    'hero.ctaJoin': 'Join the Community',
    'hero.ctaCommunities': 'Browse Communities',
    'hero.tagline': 'Connecting Gamers · Building Opportunities · Powering African Esports',
    'landing.featuredTournaments': 'Featured Tournaments',
    'landing.featuredTournamentsSub':
      'Verified regional competitions with clear deadlines, live brackets, and prize escrow transparency.',
    'landing.viewAllTournaments': 'View All Tournaments',
    'landing.viewBracketRegister': 'View Bracket & Register',
    'landing.popularGames': 'Popular Games in the Ecosystem',
    'landing.popularGamesSub':
      'Active titles across PC, PlayStation, Xbox, and Mobile in Ethiopia and neighboring regions.',
    'landing.matchmakeByGame': 'Matchmake by Game',
    'landing.barriersTitle': 'Built for Real Barriers in Ethiopian & African Esports',
    'landing.barriersSub':
      'Every GameBridge module targets a concrete bottleneck faced by competitive players, local gaming lounges, and tournament organizers.',
    'landing.communitiesTitle': 'Organized Gaming Communities & City Hubs',
    'landing.aboutTitle': 'About GameBridge',
    'rankings.eyebrow': 'Competitive Standings & Fair Play',
    'rankings.title': 'Player Rankings & Leaderboard',
    'rankings.subtitle':
      'Live competitive standings powered by verified tournament match scores, regional cups, and identity-verified player accounts.',
    'legal.title': 'Legal, Fair-Play & Youth Protection',
    'legal.subtitle':
      'Transparent governance for Ethiopian and African esports competitors, organizers, and sponsors.',
    'common.installApp': 'Install App',
    'common.offline': 'You are currently offline. Live brackets and scores will sync once reconnected.',
    'common.verifiedId': 'ID Verified',
  },
  am: {
    'nav.home': 'መነሻ',
    'nav.explore': 'ዳሰሳ',
    'nav.tournaments': 'ውድድሮች',
    'nav.rankings': 'ደረጃዎች',
    'nav.players': 'ተጫዋቾች ፈልግ',
    'nav.communities': 'ማህበረሰቦች',
    'nav.about': 'ስለ እኛ',
    'nav.connection': 'የኢንተርኔት ፍተሻ',
    'nav.opportunities': 'ስፖንሰርሺፕ እና እድሎች',
    'nav.dashboard': 'ዳሽቦርድ',
    'nav.login': 'ግባ',
    'nav.signup': 'ተመዝገብ',
    'nav.logout': 'ውጣ',
    'nav.admin': 'አስተዳዳሪ',
    'nav.legal': 'ህግ እና ፍትሃዊ ጨዋታ',
    'hero.eyebrow': 'የኢትዮጵያ እና የአፍሪካ ኢስፖርትስ መሠረተ ልማት',
    'hero.title': 'የአፍሪካ ኢስፖርትስ የወደፊት ዕጣ በግንኙነት ይጀምራል።',
    'hero.desc':
      'የቡድን አጋሮችን ያግኙ፣ በውድድሮች ይወዳደሩ፣ የጨዋታ ማህበረሰቦችን ይገንቡ እና በማደግ ላይ ባለው የኢስፖርትስ ዘርፍ ውስጥ እድሎችን ይክፈቱ።',
    'hero.ctaExplore': 'GameBridge ን ያስሱ',
    'hero.ctaJoin': 'ማህበረሰቡን ይቀላቀሉ',
    'hero.ctaCommunities': 'ማህበረሰቦችን ይመልከቱ',
    'hero.tagline': 'ተጫዋቾችን ማገናኘት · እድሎችን መገንባት · የአፍሪካን ኢስፖርትስ ማጎልበት',
    'landing.featuredTournaments': 'ተለይተው የቀረቡ ውድድሮች',
    'landing.featuredTournamentsSub':
      'ግልጽ የጊዜ ገደብ፣ ቀጥታ ብራኬቶች እና የተረጋገጠ የሽልማት ሂደት ያላቸው ክልላዊ ውድድሮች።',
    'landing.viewAllTournaments': 'ሁሉንም ውድድሮች ይመልከቱ',
    'landing.viewBracketRegister': 'ብራኬት ይመልከቱ እና ይመዝገቡ',
    'landing.popularGames': 'በስነ-ምህዳሩ ውስጥ ታዋቂ ጨዋታዎች',
    'landing.popularGamesSub':
      'በኢትዮጵያ እና በአጎራባች ክልሎች በፒሲ፣ ፕሌይስቴሽን፣ ኤክስቦክስ እና ሞባይል የሚጫወቱ ጨዋታዎች።',
    'landing.matchmakeByGame': 'በጨዋታ አጋር ይፈልጉ',
    'landing.barriersTitle': 'በኢትዮጵያ እና በአፍሪካ ኢስፖርትስ ውስጥ ላሉ እውነተኛ ተግዳሮቶች የተገነባ',
    'landing.barriersSub':
      'እያንዳንዱ የGameBridge ክፍል በተወዳዳሪ ተጫዋቾች፣ የጨዋታ ማዕከላት እና አዘጋጆች የሚገጥሙ ችግሮችን ይፈታል።',
    'landing.communitiesTitle': 'የተደራጁ የጨዋታ ማህበረሰቦች እና የከተማ ማዕከላት',
    'landing.aboutTitle': 'ስለ GameBridge',
    'rankings.eyebrow': 'የውድድር ደረጃ እና ፍትሃዊ ጨዋታ',
    'rankings.title': 'የተጫዋቾች ደረጃ ሰንጠረዥ',
    'rankings.subtitle':
      'በተረጋገጡ የውድድር ውጤቶች፣ ክልላዊ ዋንጫዎች እና በፋይዳ/መታወቂያ በተረጋገጡ መለያዎች የሚሰላ ቀጥታ ደረጃ።',
    'legal.title': 'ህግ፣ ፍትሃዊ ጨዋታ እና የታዳጊዎች ጥበቃ',
    'legal.subtitle':
      'ለኢትዮጵያ እና ለአፍሪካ ኢስፖርትስ ተወዳዳሪዎች፣ አዘጋጆች እና ስፖንሰሮች ግልጽ የአስተዳደር ደንብ።',
    'common.installApp': 'መተግበሪያ ጫን',
    'common.offline': 'ከመስመር ውጭ ነዎት። ኢንተርኔት ሲመለስ ውጤቶች ይመሳሰላሉ።',
    'common.verifiedId': 'የተረጋገጠ መታወቂያ',
  },
} as const;

export type TranslationKey = keyof typeof DICTIONARY.en;

interface LocaleThemeContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  toggleLocale: () => void;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  t: (key: TranslationKey) => string;
}

const LocaleThemeContext = createContext<LocaleThemeContextValue | null>(null);

export function LocaleThemeProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'light' ? '#F8FAFC' : '#060A14');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === 'en' ? 'am' : 'en'));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return DICTIONARY[locale][key] ?? DICTIONARY.en[key] ?? key;
    },
    [locale]
  );

  return (
    <LocaleThemeContext.Provider
      value={{ locale, setLocale, toggleLocale, theme, setTheme, toggleTheme, t }}
    >
      {children}
    </LocaleThemeContext.Provider>
  );
}

export function useLocaleTheme() {
  const ctx = useContext(LocaleThemeContext);
  if (!ctx) throw new Error('useLocaleTheme must be used inside LocaleThemeProvider');
  return ctx;
}
