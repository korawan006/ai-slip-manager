import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, ReceiptText, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload Slip', path: '/upload', icon: UploadCloud },
    { name: 'Transactions', path: '/transactions', icon: ReceiptText },
  ];

  // Extract user display info from Supabase user metadata
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const email = user?.email || '';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="w-64 border-r border-border bg-card/40 backdrop-blur-xl h-full flex flex-col p-4 fixed left-0 top-0 z-50">
      <div className="flex items-center gap-3 mb-10 px-2 mt-4">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center neon-border">
          <div className="w-4 h-4 rounded-sm bg-primary shadow-[0_0_10px_theme('colors.primary.DEFAULT')]" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          AI Slip Manager
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative group ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
                  <span className="font-medium relative z-10">{link.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & logout section */}
      <div className="mt-auto space-y-3">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full ring-2 ring-primary/30 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          id="logout-button"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 text-sm font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
