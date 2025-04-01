import React from 'react';
import { useTranslation } from 'next-i18next';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { t } = useTranslation('common');
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        aria-label={t('changeTheme')}
      >
        <option value="light">{t('lightTheme')}</option>
        <option value="dark">{t('darkTheme')}</option>
        <option value="system">{t('systemTheme')}</option>
      </select>
    </div>
  );
};

export default ThemeToggle;
