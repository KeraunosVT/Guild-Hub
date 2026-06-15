import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Sigil from './Sigil';
import { GUILD } from '../guild';
import { useAuth } from '../auth';

export default function Masthead() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/', label: 'The Hall', end: true },
    { to: '/war-record', label: 'War Record' },
    ...(user?.isAdmin ? [{ to: '/admin', label: 'Admin' }, { to: '/admin/parties', label: 'Parties' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-3 group shrink-0">
          <Sigil className="w-7 h-9 text-brass group-hover:text-brassbright transition-colors" />
          <div className="leading-none">
            <div className="font-display text-bone text-sm tracking-[0.22em]">
              {GUILD.house.toUpperCase()}
            </div>
            <div className="text-[10px] text-ash tracking-[0.3em] mt-1">
              ⟨ {GUILD.tag} ⟩
            </div>
          </div>
        </NavLink>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md font-medium tracking-wide transition-colors ${
                    isActive ? 'text-brassbright bg-panel' : 'text-ash hover:text-bone'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {user && (
            <div className="flex items-center gap-3 pl-3 ml-1 border-l border-line">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full border border-line object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-panelup border border-line flex items-center justify-center text-[11px] text-brass">
                  {(user.username || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-sm text-bone max-w-[10rem] truncate">
                {user.username}
              </span>
              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="p-2 rounded-md text-ash hover:text-oxblood hover:bg-panel transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
