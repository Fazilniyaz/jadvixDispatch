import { Moon, Sun } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useResolvedTheme } from '@/store/useTheme';

// Toggles between light and dark. Persisted via the store.
export function ThemeToggle() {
  const setTheme = useStore((s) => s.setTheme);
  const resolved = useResolvedTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] border border-border text-text-2 hover:text-text hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      {resolved === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
