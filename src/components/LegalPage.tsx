import { useEffect, useState } from 'react';
import { FileCheck2, Lock, Scale, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocaleTheme } from '../context/LocaleThemeContext';

type LegalTab = 'terms' | 'privacy' | 'fairplay' | 'youth';

export function LegalPage() {
  const { selectedLegalTab, user, navigate } = useAuth();
  const { t } = useLocaleTheme();
  const [tab, setTab] = useState<LegalTab>(selectedLegalTab || 'fairplay');

  useEffect(() => {
    if (selectedLegalTab) setTab(selectedLegalTab);
  }, [selectedLegalTab]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 sm:p-8 space-y-2">
        <p className="text-xs font-medium text-blue-400">Ecosystem Governance</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{t('legal.title')}</h1>
        <p className="text-sm text-slate-300">{t('legal.subtitle')}</p>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-[#0B1120] border border-slate-800 w-fit">
        {[
          { key: 'fairplay' as const, label: 'Fair-Play & Anti-Cheat' },
          { key: 'youth' as const, label: 'Under-18 Parental Consent' },
          { key: 'privacy' as const, label: 'Privacy & ID Hashing' },
          { key: 'terms' as const, label: 'Terms of Service' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              tab === item.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 sm:p-8 space-y-4 text-sm text-slate-300 leading-relaxed">
        {tab === 'fairplay' && (
          <>
            <div className="flex items-center gap-2 text-white font-display text-lg font-semibold">
              <Scale className="w-5 h-5 text-blue-400" aria-hidden="true" />
              <h2>Fair-Play, Match IDs & Dispute Resolution</h2>
            </div>
            <p>
              Every official bracket match on GameBridge receives a deterministic Match ID (e.g.{' '}
              <span className="font-mono text-blue-400">M-ADDI-R1M1</span>). Both teams must complete pre-match check-in before lock and submit accurate scores immediately after the final map.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-300">
              <li>
                <strong className="text-white">Anti-Smurf Policy:</strong> One unique player identity hash per competitor. Multi-accounting or roster ringing voids bracket placement and rank points.
              </li>
              <li>
                <strong className="text-white">Report → Ask → Decide → Appeal:</strong> Any competitor can dispute a Match ID. Moderators issue an inquiry (Ask), publish a written ruling (Decide), and allow one formal Appeal reviewed by a senior admin.
              </li>
              <li>
                <strong className="text-white">Zero-Fee Prize Transparency:</strong> Verified brackets never charge platform entry fees or paywalls; sponsor escrow status and Telebirr/CBE Birr claim channels are tracked openly per event.
              </li>
            </ul>
          </>
        )}

        {tab === 'youth' && (
          <>
            <div className="flex items-center gap-2 text-white font-display text-lg font-semibold">
              <FileCheck2 className="w-5 h-5 text-violet-400" aria-hidden="true" />
              <h2>Under-18 Youth Competitor & Parental Consent Policy</h2>
            </div>
            <p>
              Junior players under age 18 participating in Ethiopian school, university-prep, or open tournaments must declare Under-18 status and record guardian consent in their Profile Settings before entering prize-bearing brackets.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-300">
              <li>Guardians review match schedules, LAN hub venues, and Telegram/Email match alert channels.</li>
              <li>Prize payouts for minors under 18 require verified guardian acknowledgment via Telebirr or bank claim.</li>
            </ul>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate(user ? 'profile' : 'auth', user ? undefined : { authMode: 'login' })}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
              >
                {user ? 'Update Guardian Consent in Profile' : 'Sign In to Manage Youth Consent'}
              </button>
            </div>
          </>
        )}

        {tab === 'privacy' && (
          <>
            <div className="flex items-center gap-2 text-white font-display text-lg font-semibold">
              <Lock className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <h2>Privacy Policy & Fayda FAN Hash Binding</h2>
            </div>
            <p>
              GameBridge follows data-minimization standards. We never expose player emails, raw phone numbers, or national ID numbers on public pages, leaderboards, or sponsor CSV exports.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-300">
              <li>
                When you verify with Fayda FAN, a Student ID, or Phone OTP code, the server computes an irreversible cryptographic HMAC-SHA256 hash and discards the raw identifier immediately.
              </li>
              <li>
                Product analytics track only anonymous aggregate actions (page views, speed checks run, registrations) for ecosystem capacity planning.
              </li>
            </ul>
          </>
        )}

        {tab === 'terms' && (
          <>
            <div className="flex items-center gap-2 text-white font-display text-lg font-semibold">
              <ShieldAlert className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h2>Terms of Service</h2>
            </div>
            <p>
              GameBridge provides matchmaking, community clubs, latency estimation tools, and tournament administration for competitive players across Ethiopia and Africa.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-300">
              <li>Organizers are responsible for fulfilling announced prize pools and enforcing check-in deadlines fairly.</li>
              <li>Harassment, hate speech, cheating software, or match-fixing results in immediate account suspension.</li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
