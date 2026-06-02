import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Topbar — flex below md, hidden on md+ */}
      <Topbar onMenuToggle={() => setMobileOpen(true)} />

      {/* Sidebar — hidden below md, fixed on md+ */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main content area */}
      <main className="flex-1 w-full min-h-screen transition-all duration-300 pt-16 md:pt-0 md:pl-64">
        {/* Decorative background glows */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed top-[30%] right-[-5%] w-[25%] h-[25%] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
