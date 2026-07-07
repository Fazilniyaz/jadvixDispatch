# Jadvix Dispatch

A frontend demo for **Jadvix Ltd** — a parcel/product delivery management platform.
Marketing landing page, a dummy auth flow, and two role-based portals (Super Admin +
Driver) sharing one design system. No backend: data is seeded in memory and persisted
to `localStorage`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # typecheck + production build
npm run preview  # serve the production build
```

## Demo credentials

| Role  | Email              | Password    | Lands on  |
| ----- | ------------------ | ----------- | --------- |
| Admin | `admin@gmail.com`  | `admin@123` | `/admin`  |
| Driver| `driver@gmail.com` | `driver@123`| `/driver` |

Flow: **Landing → Continue → Signup (any input) → Login → role-based portal.**
Anything other than the two credential sets shows `Invalid email or password.`

## Stack

Vite · React · TypeScript · Tailwind CSS v3 (themed via CSS variables) · React Router v6 ·
Zustand (persisted) · lucide-react · Recharts · Inter + IBM Plex Mono.

## Cross-portal behaviour (shared Zustand store)

- Driver submits **leave** → appears in Admin → Leave Requests as pending → approving
  flips that driver to `leave` everywhere.
- Driver advances a **product status** → Admin's product board updates immediately.
- **Chat** is one shared channel — messages from either side show on both.
- Renaming a **module** in Settings updates its label across nav + page titles instantly.
- Shifts show **waves** with a live "current shift + wave" indicator.
- **Routes** render as ordered area-name + coordinate stop chains — no map.

## Structure

```
src/
  components/   shared kit: Button, Card, StatusPill, DataTable, Modal, SidePanel,
                Field, ChatPanel, RouteChain, PortalShell, KpiTile, …
  pages/        landing, signup, login
  portals/
    admin/      Dashboard, ProductManagement, EmployeeManagement, ShiftManagement,
                BayManagement, RouteManagement, LeaveRequests, Communication, Settings
    driver/     Today, MyDeliveries, MyRoute, Communication, Leave
  store/        Zustand store (typed) + theme
  data/         seed data (Chennai + London)
  lib/          types + utils
```

Theme (light/dark) is a single CSS-variable swap, defaults to system preference, and
persists. The toggle sits in the top bar of every screen.

© 2026 Jadvix Ltd · Registered in England and Wales (Company No. 16055823)
