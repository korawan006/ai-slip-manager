import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto relative">
        {/* Decorative background glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-6xl mx-auto h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
