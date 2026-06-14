import { NavLink } from 'react-router-dom';
import Sigil from './Sigil';
import { GUILD } from '../guild';

const links = [
  { to: '/', label: 'The Hall', end: true },
  { to: '/war-record', label: 'War Record' },
];

export default function Masthead() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 group">
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

        <nav className="flex items-center gap-1 text-sm">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-md font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'text-brassbright bg-panel'
                    : 'text-ash hover:text-bone'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
