import { Menu, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ onMenuToggle }) {
  const { user } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'User';
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  return (
    <header className="flex md:hidden fixed inset-x-0 top-0 h-16 z-50 items-center justify-between px-4 bg-card/80 backdrop-blur-xl border-b border-border/60">
      {/* Hamburger — neon blue glow */}
      <button
        onClick={onMenuToggle}
        className="relative p-2 rounded-xl text-primary hover:text-white transition-colors duration-200 group"
        aria-label="Open menu"
      >
        <span className="absolute inset-0 rounded-xl bg-primary/10 shadow-[0_0_14px_rgba(99,102,241,0.55),0_0_40px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_18px_rgba(99,102,241,0.7),0_0_50px_rgba(99,102,241,0.3)] transition-shadow duration-300" />
        <Menu className="w-5 h-5 relative z-10" />
      </button>

      {/* Centered logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <QrCode className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 whitespace-nowrap">
          AI Slip Manager
        </span>
      </div>

      {/* User profile — right side */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs text-gray-400 font-medium hidden sm:block truncate max-w-[120px]">
          {displayName}
        </span>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full ring-2 ring-primary/30 flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ring-2 ring-primary/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
