import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, KeyRound, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, PasswordInput, Select } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useEmailTaken, useHubCodeTaken } from '@/lib/scope';
import { buildDefaultPermissions, grantableModules } from '@/lib/modules';
import { HUB_AUTHORITY_ROLES, ROLE_LABELS, type Hub, type ModuleKey, type Role } from '@/lib/types';

/** One authority slot while composing a hub. */
interface AuthoritySetup {
  enabled: boolean;
  email: string;
  password: string;
  modules: ModuleKey[];
}

const blankAuthorities = (): Record<Role, AuthoritySetup> => {
  const defaults = buildDefaultPermissions();
  return HUB_AUTHORITY_ROLES.reduce(
    (acc, r) => ({ ...acc, [r]: { enabled: false, email: '', password: '', modules: defaults[r] } }),
    {} as Record<Role, AuthoritySetup>
  );
};

export default function Hubs() {
  const user = useStore((s) => s.user);
  const labels = useStore((s) => s.moduleLabels);
  const hubs = useStore((s) => s.hubs);
  const employees = useStore((s) => s.employees);
  const credentials = useStore((s) => s.credentials);
  const activeHubId = useStore((s) => s.activeHubId);
  const switchHub = useStore((s) => s.switchHub);
  const addHub = useStore((s) => s.addHub);
  const updateHub = useStore((s) => s.updateHub);
  const deleteHub = useStore((s) => s.deleteHub);
  const addCredential = useStore((s) => s.addCredential);
  const deleteCredential = useStore((s) => s.deleteCredential);
  const setHubRoleModules = useStore((s) => s.setHubRoleModules);
  const hubPermissions = useStore((s) => s.hubPermissions);

  const mine = hubs.filter((h) => h.companyId === user?.companyId);
  const emailTaken = useEmailTaken();
  const codeTaken = useHubCodeTaken();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [editing, setEditing] = useState<Hub | null>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '', imageUrl: '' });
  const [auth, setAuth] = useState<Record<Role, AuthoritySetup>>(blankAuthorities());
  const [confirm, setConfirm] = useState<Hub | null>(null);
  const [credFor, setCredFor] = useState<Hub | null>(null);
  const [credForm, setCredForm] = useState({ role: 'hub-manager' as Role, email: '', password: '' });
  const [dupMsg, setDupMsg] = useState('');

  const startCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', address: '', city: '', imageUrl: '' });
    setAuth(blankAuthorities());
    setStep(1);
    setOpen(true);
  };

  const startEdit = (h: Hub) => {
    setEditing(h);
    setForm({ name: h.name, code: h.code, address: h.address, city: h.city, imageUrl: h.imageUrl });
    setStep(1);
    setOpen(true);
  };

  /** Creates the hub, its authority logins, and each role's module access in one go. */
  const finish = () => {
    if (!form.name.trim() || !user?.companyId) return;
    if (codeTaken(form.code, editing?.id)) return setDupMsg(`Hub code "${form.code.toUpperCase()}" is already in use.`);
    const clashEmail = HUB_AUTHORITY_ROLES.map((r) => auth[r]).find((a) => a?.enabled && emailTaken(a.email));
    if (clashEmail) return setDupMsg(`The email ${clashEmail.email} already exists. Use a unique one.`);
    setDupMsg('');
    const payload = {
      companyId: user.companyId,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      address: form.address,
      city: form.city,
      imageUrl: form.imageUrl,
    };

    if (editing) {
      updateHub(editing.id, payload);
    } else {
      addHub(payload);
      const created = useStore.getState().hubs.slice(-1)[0];
      if (created) {
        HUB_AUTHORITY_ROLES.forEach((r) => {
          const a = auth[r];
          if (!a?.enabled) return;
          if (a.email.trim() && a.password) {
            addCredential({
              role: r,
              companyId: user.companyId,
              hubId: created.id,
              employeeId: null,
              email: a.email.trim(),
              password: a.password,
              hubCode: created.code,
            });
          }
          setHubRoleModules(created.id, r, a.modules);
        });
        // Roles left off get no access at this hub at all.
        HUB_AUTHORITY_ROLES.filter((r) => !auth[r]?.enabled).forEach((r) =>
          setHubRoleModules(created.id, r, [])
        );
        switchHub(created.id);
      }
    }
    setOpen(false);
    setEditing(null);
  };

  const toggleModule = (role: Role, key: ModuleKey) =>
    setAuth((a) => {
      const cur = a[role].modules;
      return {
        ...a,
        [role]: {
          ...a[role],
          modules: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
        },
      };
    });

  const enabledCount = HUB_AUTHORITY_ROLES.filter((r) => auth[r]?.enabled).length;
  const step2Invalid = HUB_AUTHORITY_ROLES.some(
    (r) => auth[r]?.enabled && (!auth[r].email.trim() || !auth[r].password)
  );

  return (
    <div>
      <PageHeader
        title={labels.hubs}
        description="Compose each hub: its details, which authorities it has, their logins and what they can open."
        action={<Button variant="primary" onClick={startCreate}><Plus size={16} />New hub</Button>}
      />

      {mine.length === 0 ? (
        <Card className="p-10 text-center text-[13px] text-text-2">No hubs yet. Create your first hub.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mine.map((h) => {
            const isDefault = h.id === activeHubId;
            const staff = employees.filter((e) => e.hubId === h.id).length;
            const logins = credentials.filter((c) => c.hubId === h.id && c.role !== 'driver');
            const perms = hubPermissions[h.id];
            return (
              <Card key={h.id} className={cn(isDefault && 'border-accent')}>
                <CardHeader
                  title={<span className="flex items-center gap-2">{h.name}{isDefault && <Star size={13} className="text-accent" />}</span>}
                  subtitle={<span className="font-mono text-2xs">{h.code} · {h.city}</span>}
                  action={
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(h)} aria-label="Edit hub" className="text-muted hover:text-text p-1"><Pencil size={14} /></button>
                      <button onClick={() => setConfirm(h)} aria-label="Delete hub" className="text-muted hover:text-exception p-1"><Trash2 size={14} /></button>
                    </div>
                  }
                />
                {h.imageUrl ? (
                  <img src={h.imageUrl} alt="" className="h-28 w-full object-cover border-b border-border" />
                ) : (
                  <div className="h-20 grid place-items-center border-b border-border bg-surface-2 text-muted"><Building2 size={20} /></div>
                )}
                <div className="p-4 space-y-3">
                  <p className="text-2xs text-text-2">{h.address || 'No address on file'}</p>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted">Staff</span><span className="text-text tnum font-medium">{staff}</span>
                  </div>
                  <div>
                    <div className="text-2xs uppercase tracking-wide text-muted mb-1.5">Authorities ({logins.length})</div>
                    <div className="space-y-1">
                      {logins.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 text-2xs">
                          <KeyRound size={11} className="text-muted shrink-0" />
                          <span className="text-text-2 truncate flex-1">
                            {ROLE_LABELS[c.role]} · {c.email}
                            {perms?.[c.role] && <span className="text-muted"> · {perms[c.role].length} modules</span>}
                          </span>
                          <button onClick={() => deleteCredential(c.id)} aria-label="Remove login" className="text-muted hover:text-exception"><Trash2 size={12} /></button>
                        </div>
                      ))}
                      {logins.length === 0 && <p className="text-2xs text-muted">None yet.</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => { setCredFor(h); setCredForm({ role: 'hub-manager', email: '', password: '' }); }}>
                      <Plus size={13} />Authority
                    </Button>
                    <Button size="sm" variant={isDefault ? 'ghost' : 'primary'} disabled={isDefault} onClick={() => switchHub(h.id)}>
                      {isDefault ? 'Default' : 'Set default'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / edit hub — two steps when creating */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="max-w-2xl"
        title={
          editing
            ? `Edit ${editing.name}`
            : step === 1
              ? 'New hub · 1 of 2 — Hub details'
              : 'New hub · 2 of 2 — Authorities & access'
        }
        footer={
          editing ? (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={finish} disabled={!form.name.trim()}>Save changes</Button>
            </>
          ) : step === 1 ? (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setStep(2)} disabled={!form.name.trim() || !form.code.trim()}>
                Next: authorities <ArrowRight size={15} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft size={15} />Back</Button>
              <Button variant="primary" onClick={finish} disabled={step2Invalid}>
                <Check size={15} />Create hub{enabledCount ? ` + ${enabledCount} login${enabledCount > 1 ? 's' : ''}` : ''}
              </Button>
            </>
          )
        }
      >
        {dupMsg && (
          <p
            className="mb-3 text-2xs text-exception border border-exception rounded-[3px] px-2.5 py-1.5"
            style={{ backgroundColor: 'color-mix(in srgb, var(--exception) 10%, transparent)' }}
          >
            {dupMsg}
          </p>
        )}
        {step === 1 || editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Hub name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chennai Central" autoFocus /></Field>
            <Field label="Hub code" hint="Used in every login for this hub"><Input className="font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CHN-01" /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Address" className="sm:col-span-2"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="Image URL" className="sm:col-span-2" hint="Optional photo of the hub"><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" /></Field>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-text-2">
              Not every hub has every role. Turn on only the authorities <b className="text-text">{form.name}</b> needs,
              give each a login, and tick what they may open.
            </p>
            {HUB_AUTHORITY_ROLES.map((r) => {
              const a = auth[r];
              const options = grantableModules(r);
              return (
                <div key={r} className={cn('border rounded-[4px] p-3 transition-colors', a.enabled ? 'border-accent bg-accent/5' : 'border-border')}>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={a.enabled}
                      onChange={() => setAuth((p) => ({ ...p, [r]: { ...p[r], enabled: !p[r].enabled } }))}
                      className="h-4 w-4 accent-accent"
                    />
                    <span className="text-[13px] font-medium text-text">{ROLE_LABELS[r]}</span>
                    {a.enabled && <span className="ml-auto text-2xs text-muted tnum">{a.modules.length} modules</span>}
                  </label>

                  {a.enabled && (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Login email">
                          <Input type="email" className="font-mono" value={a.email}
                            onChange={(e) => setAuth((p) => ({ ...p, [r]: { ...p[r], email: e.target.value } }))}
                            placeholder="name@company.com" />
                        </Field>
                        <Field label="Password">
                          <Input className="font-mono" value={a.password}
                            onChange={(e) => setAuth((p) => ({ ...p, [r]: { ...p[r], password: e.target.value } }))} />
                        </Field>
                      </div>
                      <div>
                        <div className="text-2xs uppercase tracking-wide text-muted mb-1.5">Modules they can open</div>
                        <div className="flex flex-wrap gap-1.5">
                          {options.map((m) => {
                            const on = a.modules.includes(m.key);
                            return (
                              <button
                                key={m.key}
                                type="button"
                                onClick={() => toggleModule(r, m.key)}
                                className={cn('text-2xs rounded-[3px] border px-2 py-1 transition-colors',
                                  on ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-2 hover:bg-surface-2')}
                              >
                                {labels[m.key] ?? m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-2xs text-muted">
                        Signs in with this email, password and hub code{' '}
                        <span className="font-mono text-text-2">{form.code || '—'}</span>.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            {enabledCount === 0 && (
              <p className="text-2xs text-muted">
                No authorities selected — you can add them later from the hub card.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Add a single authority to an existing hub */}
      <Modal open={!!credFor} onClose={() => setCredFor(null)} title={`Add authority · ${credFor?.name ?? ''}`}
        footer={<><Button variant="ghost" onClick={() => setCredFor(null)}>Cancel</Button>
          <Button variant="primary" disabled={!credForm.email.trim() || !credForm.password}
            onClick={() => {
              if (!credFor || !user?.companyId) return;
              addCredential({ role: credForm.role, companyId: user.companyId, hubId: credFor.id, employeeId: null, email: credForm.email.trim(), password: credForm.password, hubCode: credFor.code });
              // Give them this hub's default access for their role.
              const existing = hubPermissions[credFor.id]?.[credForm.role];
              if (!existing || existing.length === 0) {
                setHubRoleModules(credFor.id, credForm.role, buildDefaultPermissions()[credForm.role]);
              }
              setCredFor(null);
            }}>Create login</Button></>}>
        <div className="space-y-4">
          <Field label="Portal">
            <Select value={credForm.role} onChange={(e) => setCredForm({ ...credForm, role: e.target.value as Role })}>
              {HUB_AUTHORITY_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </Select>
          </Field>
          <Field label="Email"><Input type="email" className="font-mono" value={credForm.email} onChange={(e) => setCredForm({ ...credForm, email: e.target.value })} /></Field>
          <Field label="Password"><PasswordInput className="font-mono" value={credForm.password} onChange={(e) => setCredForm({ ...credForm, password: e.target.value })} /></Field>
          <p className="text-2xs text-muted">
            They sign in with hub code <span className="font-mono text-text-2">{credFor?.code}</span>. Fine-tune their
            modules afterwards in Settings → Portal access.
          </p>
        </div>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete hub"
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm) deleteHub(confirm.id); setConfirm(null); }}>Delete</Button></>}>
        <p className="text-[13px] text-text-2">Delete <b className="text-text">{confirm?.name}</b>? Its staff, logins and bays are removed too.</p>
      </Modal>
    </div>
  );
}
