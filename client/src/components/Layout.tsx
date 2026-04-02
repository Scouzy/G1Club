import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import AiChatWidget from './AiChatWidget';

interface LayoutProps {
  children: ReactNode;
}

const LayoutInner: React.FC<LayoutProps> = ({ children }) => {
  const { collapsed } = useSidebar();
  return (
    <div className="h-[100dvh] bg-background text-foreground flex overflow-hidden">
      <Sidebar />
      <main
        className={`flex-1 min-w-0 overflow-x-hidden overflow-y-auto transition-all duration-300 ${
          collapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="w-full p-3 sm:p-4 md:p-8 pt-14 md:pt-8 max-w-full">
          {children}
        </div>
      </main>
      <AiChatWidget />
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <SidebarProvider>
    <LayoutInner>{children}</LayoutInner>
  </SidebarProvider>
);

export default Layout;
