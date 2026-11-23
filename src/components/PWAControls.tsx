import { useEffect, useState } from 'react';
import { Download, WifiOff } from 'lucide-react';
import { useLocaleTheme } from '../context/LocaleThemeContext';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { t } = useLocaleTheme();

  if (isInstalled || !isInstallable) return null;

  return (
    <button
      type="button"
      onClick={install}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-950/40 hover:bg-blue-600/30 text-xs font-semibold text-blue-300 transition-colors whitespace-nowrap shrink-0"
    >
      <Download className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{t('common.installApp')}</span>
    </button>
  );
}

export function OfflineIndicator() {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const { t } = useLocaleTheme();

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-500/40 bg-amber-950/70 px-4 py-2 text-xs text-amber-200 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{t('common.offline')}</span>
    </div>
  );
}
