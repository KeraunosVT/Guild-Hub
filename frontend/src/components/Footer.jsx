import { GUILD } from '../guild';

export default function Footer() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="font-display text-xs tracking-[0.25em] text-ash">
          {GUILD.house.toUpperCase()}
        </div>
        <div className="text-xs text-ash">
          Known across seasons as{' '}
          <span className="text-bone/70">{GUILD.aliases.join(' · ')}</span>
        </div>
      </div>
    </footer>
  );
}
