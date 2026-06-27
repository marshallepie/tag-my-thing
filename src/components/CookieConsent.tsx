import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cookie } from 'lucide-react';
import { Button } from './ui/Button';
import {
  hasMadeConsentChoice,
  grantAnalyticsConsent,
  revokeAnalyticsConsent,
} from '../lib/analytics';

/**
 * Cookie consent banner. Shown until the visitor makes an explicit choice.
 * "Accept" grants Google Analytics consent (loads gtag.js immediately);
 * "Decline" stores a denial. The choice is persisted in localStorage and can be
 * changed later via Settings → Privacy → Analytics Tracking.
 */
export const CookieConsent: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer so it doesn't compete with first paint.
    if (!hasMadeConsentChoice()) {
      const id = window.setTimeout(() => setVisible(true), 800);
      return () => window.clearTimeout(id);
    }
  }, []);

  const accept = () => {
    grantAnalyticsConsent();
    setVisible(false);
  };

  const decline = () => {
    revokeAnalyticsConsent();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-live="polite"
          aria-label={t('cookieConsent.title', 'Cookie preferences')}
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">
                    {t('cookieConsent.title', 'We value your privacy')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {t(
                      'cookieConsent.description',
                      'We use analytics cookies to understand how you use TagMyThing and improve the experience. Nothing is tracked until you accept.'
                    )}{' '}
                    <Link
                      to="/cookie-policy"
                      className="text-primary-600 hover:text-primary-700 underline whitespace-nowrap"
                    >
                      {t('cookieConsent.learnMore', 'Learn more')}
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={decline} className="flex-1 sm:flex-none">
                  {t('cookieConsent.decline', 'Decline')}
                </Button>
                <Button variant="primary" size="sm" onClick={accept} className="flex-1 sm:flex-none">
                  {t('cookieConsent.accept', 'Accept')}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
