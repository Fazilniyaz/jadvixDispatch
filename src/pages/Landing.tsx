import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  MessageSquare,
  Package,
  Route as RouteIcon,
  Truck,
  Users,
  Waves,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/Button';
import { MiniDashboard } from '@/components/MiniDashboard';

const features = [
  {
    icon: Package,
    title: 'Product tracking',
    body: 'Every product carries a code, type, owner and live status from arrival to delivery.',
  },
  {
    icon: Users,
    title: 'Fleet & staff',
    body: 'Drivers, dispatchers, vehicles and contacts in one register with delivery history.',
  },
  {
    icon: Waves,
    title: 'Shifts & waves',
    body: 'Plan the day in shifts and waves, and see exactly which wave is running now.',
  },
  {
    icon: RouteIcon,
    title: 'Routes & bays',
    body: 'Sequenced stops by area and coordinate, matched to loading bays and vehicles.',
  },
  {
    icon: MessageSquare,
    title: 'Live communication',
    body: 'One shared channel keeps dispatch and drivers on the same page in real time.',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full flex flex-col bg-bg">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
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
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-2xs font-medium text-text-2 border border-border rounded-[3px] px-2 py-1">
              <Truck size={12} className="text-accent" />
              Delivery operations, Chennai & London
            </span>
            <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-text leading-[1.1]">
              Run product delivery end to end, from bay to doorstep.
            </h1>
            <p className="mt-4 text-[15px] text-text-2 max-w-lg leading-relaxed">
              Jadvix Dispatch brings products, drivers, shifts, routes and communication into one
              system. Plan the day, assign the work, and watch every delivery move in real time.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Button variant="primary" size="md" onClick={() => navigate('/signup')}>
                Continue
                <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
            <p className="mt-4 text-2xs text-muted">
              No setup required — this is a live demo seeded with real-looking operations data.
            </p>
          </div>
          <div className="lg:pl-6">
            <MiniDashboard />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-xl font-semibold tracking-tight text-text">
            One system for the whole operation
          </h2>
          <p className="mt-2 text-[14px] text-text-2 max-w-xl">
            Each module maps to a real part of the delivery day. Nothing decorative — every screen
            does a job.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-[3px] overflow-hidden">
            {features.map((f) => (
              <div key={f.title} className="bg-surface p-5">
                <f.icon size={18} className="text-accent" />
                <h3 className="mt-3 text-sm font-semibold text-text">{f.title}</h3>
                <p className="mt-1.5 text-[13px] text-text-2 leading-relaxed">{f.body}</p>
              </div>
            ))}
            <div className="bg-surface-2 p-5 flex flex-col justify-center">
              <Boxes size={18} className="text-text-2" />
              <p className="mt-3 text-[13px] text-text-2 leading-relaxed">
                Built as one design system, so the portals and this page feel like a single product.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two portals */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-xl font-semibold tracking-tight text-text">Two portals, one system</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-px bg-border border border-border rounded-[3px] overflow-hidden">
            <PortalCard
              title="Super Admin"
              subtitle="Plan and oversee the whole operation"
              points={[
                'Create and assign products across drivers and waves',
                'Manage staff, shifts, bays and routes',
                'Approve leave and track exceptions live',
              ]}
            />
            <PortalCard
              title="Driver"
              subtitle="Everything for the day, nothing more"
              points={[
                'See today’s shift, wave, bay and assigned products',
                'Advance each delivery from picked to delivered',
                'Follow the ordered route and message dispatch',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Stat value="2" label="Operating hubs" />
          <Stat value="96%" label="On-time delivery" />
          <Stat value="5" label="Active routes" />
          <Stat value="24/7" label="Shift coverage" />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-text">
              See the operation in motion.
            </h2>
            <p className="mt-2 text-[14px] text-text-2 max-w-md">
              Continue to create an account, then sign in to either portal with the demo
              credentials.
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/signup')}>
            Continue
            <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Logo showProduct={false} />
          <p className="text-2xs text-muted">
            © 2026 Jadvix Ltd · Registered in England and Wales (Company No. 16055823)
          </p>
          <div className="flex items-center gap-4 text-2xs text-muted">
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
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle: string;
  points: string[];
}) {
  return (
    <div className="bg-surface p-6">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="text-[13px] text-text-2 mt-0.5">{subtitle}</p>
      <ul className="mt-4 space-y-2">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-[13px] text-text-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 bg-accent" aria-hidden />
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
      <div className="text-2xl font-semibold tracking-tight text-text tnum">{value}</div>
      <div className="text-2xs text-muted mt-1">{label}</div>
    </div>
  );
}
