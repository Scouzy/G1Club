import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';

interface LayoutProps {
  children: ReactNode;
}

const LayoutInner: React.FC<LayoutProps> = ({ children }) => {
  const { collapsed } = useSidebar();
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <div className="container mx-auto p-4 md:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <SidebarProvider>
    <LayoutInner>{children}</LayoutInner>
  </SidebarProvider>
);

export default Layout;
