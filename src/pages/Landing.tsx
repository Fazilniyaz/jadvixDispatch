import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  MessageSquare,
  Package,
  Route as RouteIcon,
  Users,
  Waves,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/Button';
import { MiniDashboard } from '@/components/MiniDashboard';

// 3D hero scene is heavy (three.js) — load it lazily so it never blocks first paint.
const HeroScene = lazy(() => import('@/components/HeroScene'));

// The 3D scene is laptop/desktop only. This gates the mount (not just visibility),
// so the three.js chunk is never downloaded on phones or tablets.
function useIsLargeScreen() {
  const query = '(min-width: 1024px)';
  const [isLarge, setIsLarge] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setIsLarge(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isLarge;
}

const features = [
  {
    icon: Package,
    title: 'Product tracking',
    body: 'Every product carries a code, type, owner and live status from arrival to doorstep.',
  },
  {
    icon: Users,
    title: 'Fleet & staff',
    body: 'Drivers, dispatchers, vehicles and contacts in one register, with full delivery history.',
  },
  {
    icon: Waves,
    title: 'Shifts & waves',
    body: 'Plan the day in shifts and waves, and always know which wave is running right now.',
  },
  {
    icon: RouteIcon,
    title: 'Routes & bays',
    body: 'Ordered stops by area and coordinate, matched to the right loading bay and vehicle.',
  },
  {
    icon: MessageSquare,
    title: 'Live communication',
    body: 'One shared channel keeps dispatch and every driver moving in step, in real time.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const showScene = useIsLargeScreen();

  return (
    <div className="min-h-full flex flex-col bg-bg">
      {/* Top bar */}
      <header className="border-b border-border sticky top-0 z-30 bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button variant="primary" onClick={() => navigate('/signup')}>
              Continue
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 pb-14 sm:pt-20 sm:pb-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-6 items-center">
          <div>
            <div className="font-mono text-2xs uppercase tracking-[0.22em] text-muted">
              Dispatch operations · London &amp; Chennai
            </div>
            <h1 className="mt-6 font-display font-semibold text-text tracking-tight leading-[0.95] text-[2.75rem] sm:text-6xl lg:text-[4.25rem] max-w-2xl">
              Run product delivery, from bay to <span className="text-accent">doorstep</span>.
            </h1>
            <p className="mt-7 text-lg text-text-2 max-w-xl leading-relaxed">
              Jadvix Dispatch brings products, drivers, shifts, routes and communication into a
              single system. Plan the day, assign the work, and watch every delivery move.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" size="md" onClick={() => navigate('/signup')}>
                Continue
                <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Sign in to a portal
              </Button>
            </div>
          </div>

          {/* 3D parcel delivery scene — laptop / desktop only */}
          <div className="relative hidden lg:block h-[440px]">
            {showScene && (
              <Suspense
                fallback={
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="font-mono text-2xs uppercase tracking-[0.2em] text-muted animate-pulse">
                      Loading scene…
                    </div>
                  </div>
                }
              >
                <HeroScene />
              </Suspense>
            )}
          </div>
        </div>
      </section>

      {/* Live product frame */}
      <section className="border-b border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-center">
            <div>
              <div className="font-mono text-2xs uppercase tracking-[0.2em] text-muted">
                Live, in the browser
              </div>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl font-semibold text-text tracking-tight leading-tight">
                Not a screenshot. The real dashboard.
              </h2>
              <p className="mt-4 text-[15px] text-text-2 leading-relaxed max-w-md">
                This demo is seeded with realistic operations data across two hubs. The panel to the
                side is the same component the admin portal runs — reading live from shared state.
              </p>
              <Link
                to="/signup"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
              >
                Open the full product
                <ArrowUpRight size={15} />
              </Link>
            </div>
            <div>
              <MiniDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities — editorial two-column */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-20 grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
          <div className="lg:sticky lg:top-24 self-start">
            <div className="font-mono text-2xs uppercase tracking-[0.2em] text-muted">
              What it does
            </div>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-semibold text-text tracking-tight leading-tight">
              One system for the whole operation.
            </h2>
            <p className="mt-4 text-[15px] text-text-2 leading-relaxed max-w-sm">
              Every module maps to a real part of the delivery day. Nothing decorative — each screen
              does a job.
            </p>
          </div>
          <div className="border-t border-border">
            {features.map((f) => (
              <div
                key={f.title}
                className="group flex items-start gap-5 py-6 border-b border-border"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center border border-border rounded-[3px] text-text-2 group-hover:text-accent group-hover:border-accent transition-colors">
                  <f.icon size={18} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-text tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-[14px] text-text-2 leading-relaxed max-w-md">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two portals */}
      <section className="border-b border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-20">
          <div className="font-mono text-2xs uppercase tracking-[0.2em] text-muted">
            Two portals, one system
          </div>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl font-semibold text-text tracking-tight leading-tight max-w-2xl">
            Built for the people who plan, and the people who drive.
          </h2>
          <div className="mt-10 grid md:grid-cols-2 gap-px bg-border border border-border rounded-[3px] overflow-hidden">
            <PortalCard
              tag="Super Admin"
              title="Plan and oversee everything"
              points={[
                'Create and assign products across drivers and waves',
                'Manage staff, shifts, bays and routes',
                'Approve leave and track exceptions live',
              ]}
            />
            <PortalCard
              tag="Driver"
              title="Everything for the day, nothing more"
              points={[
                'See today’s shift, wave, bay and assigned products',
                'Advance each delivery from picked to delivered',
                'Follow the ordered route and message dispatch',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <Stat value="2" label="Operating hubs" />
          <Stat value="96%" label="On-time delivery" />
          <Stat value="5" label="Active routes" />
          <Stat value="24/7" label="Shift coverage" />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-20 text-center sm:text-left sm:flex sm:items-end sm:justify-between gap-8">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-text tracking-tight leading-[1.02] max-w-2xl">
              See the operation in motion.
            </h2>
            <p className="mt-4 text-[15px] text-text-2 max-w-md sm:mx-0 mx-auto">
              Continue to create an account, then sign in to either portal with the demo credentials.
            </p>
          </div>
          <div className="mt-8 sm:mt-0 shrink-0">
            <Button variant="primary" size="md" onClick={() => navigate('/signup')}>
              Continue
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Logo showProduct={false} />
          <p className="text-2xs text-muted">
            © 2026 Jadvix Ltd · Registered in England and Wales (Company No. 16055823)
          </p>
          <div className="flex items-center gap-5 text-2xs text-muted">
            <Link to="/login" className="hover:text-text">
              Sign in
            </Link>
            <Link to="/signup" className="hover:text-text">
              Continue
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PortalCard({
  tag,
  title,
  points,
}: {
  tag: string;
  title: string;
  points: string[];
}) {
  return (
    <div className="bg-surface p-7">
      <div className="font-mono text-2xs uppercase tracking-[0.16em] text-accent">{tag}</div>
      <h3 className="mt-3 font-display text-xl font-semibold text-text tracking-tight">{title}</h3>
      <ul className="mt-5 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-[14px] text-text-2 leading-relaxed">
            <span className="mt-2 h-1 w-1 shrink-0 bg-accent" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-text tnum leading-none">
        {value}
      </div>
      <div className="text-2xs uppercase tracking-[0.14em] text-muted mt-3 font-mono">{label}</div>
    </div>
  );
}
