'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUser,
  updateUser,
  setUserActive,
  resetPassword,
  type ActionResult,
} from '@/app/actions/users';

type Row = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'HEAD' | 'CRE';
  department: string | null;
  locale: 'en' | 'ta';
  active: boolean;
};

const ROLES = ['ADMIN', 'HEAD', 'CRE'] as const;
const inputCls =
  'w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm outline-none focus:border-gold';

export function UserManager({ users, currentUserId }: { users: Row[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CRE' as Row['role'],
    department: '',
    locale: 'en' as Row['locale'],
  });

  function run(p: Promise<ActionResult>, success: string) {
    start(async () => {
      const res = await p;
      if (res.ok) {
        setMsg({ kind: 'ok', text: success });
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error });
      }
    });
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    run(createUser(form), 'User created');
    setForm({ name: '', email: '', password: '', role: 'CRE', department: '', locale: 'en' });
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            msg.kind === 'ok' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Create */}
      <form onSubmit={onCreate} className="vtm-card space-y-3">
        <h3 className="vtm-label">Add user</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={inputCls} placeholder="Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputCls} type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className={inputCls} type="password" placeholder="Temp password (min 8)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <input className={inputCls} placeholder="Department" value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <select className={inputCls} value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Row['role'] })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className={inputCls} value={form.locale}
            onChange={(e) => setForm({ ...form, locale: e.target.value as Row['locale'] })}>
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>
        <button disabled={pending}
          className="min-h-tap rounded-lg bg-gold px-4 text-sm font-bold text-ink disabled:opacity-60">
          {pending ? 'Saving…' : 'Create user'}
        </button>
      </form>

      {/* List */}
      <div className="space-y-2">
        {users.map((u) => (
          <UserRow key={u.id} user={u} currentUserId={currentUserId} pending={pending} run={run} />
        ))}
      </div>
    </div>
  );
}

function UserRow({
  user,
  currentUserId,
  pending,
  run,
}: {
  user: Row;
  currentUserId: string;
  pending: boolean;
  run: (p: Promise<ActionResult>, success: string) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({
    name: user.name,
    role: user.role,
    department: user.department ?? '',
    locale: user.locale,
  });

  return (
    <div className={`vtm-card ${user.active ? '' : 'opacity-60'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{user.name}</div>
          <div className="truncate text-xs text-muted">{user.email}</div>
          <div className="mt-1 text-[11px] text-neutral-400">
            {user.role}
            {user.department ? ` · ${user.department}` : ''} · {user.locale.toUpperCase()}
            {user.active ? '' : ' · INACTIVE'}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-1">
          <button onClick={() => setEdit((v) => !v)}
            className="min-h-tap rounded-md bg-neutral-700 px-2 text-xs font-bold">
            {edit ? 'Close' : 'Edit'}
          </button>
          <button disabled={pending || user.id === currentUserId}
            onClick={() => run(setUserActive(user.id, !user.active), user.active ? 'Deactivated' : 'Activated')}
            className={`min-h-tap rounded-md px-2 text-xs font-bold disabled:opacity-40 ${
              user.active ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'
            }`}>
            {user.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {edit && (
        <div className="mt-3 space-y-2 border-t border-neutral-700 pt-3">
          <input className={inputCls} value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <select className={inputCls} value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value as Row['role'] })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className={inputCls} value={draft.locale}
              onChange={(e) => setDraft({ ...draft, locale: e.target.value as Row['locale'] })}>
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
          <input className={inputCls} placeholder="Department" value={draft.department}
            onChange={(e) => setDraft({ ...draft, department: e.target.value })} />
          <div className="flex gap-2">
            <button disabled={pending}
              onClick={() => run(updateUser({ id: user.id, ...draft }), 'User updated')}
              className="min-h-tap rounded-lg bg-gold px-3 text-sm font-bold text-ink disabled:opacity-60">
              Save
            </button>
            <button disabled={pending}
              onClick={() => {
                const pw = window.prompt('New temporary password (min 8 chars):');
                if (pw) run(resetPassword(user.id, pw), 'Password reset');
              }}
              className="min-h-tap rounded-lg bg-neutral-700 px-3 text-sm font-bold">
              Reset password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
