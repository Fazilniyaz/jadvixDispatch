import { useEffect } from 'react';
import { useStore, type ThemePref } from './useStore';

function resolve(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

// Applies the theme preference to <html data-theme> and keeps it in sync
// with system changes when preference is "system". Call once, high in the tree.
export function useThemeEffect() {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const apply = () =>
      document.documentElement.setAttribute('data-theme', resolve(theme));
    apply();

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);
}

export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useStore((s) => s.theme);
  return resolve(theme);
}
