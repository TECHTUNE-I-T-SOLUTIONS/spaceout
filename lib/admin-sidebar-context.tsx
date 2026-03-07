'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface AdminSidebarContextType {
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined);

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setCollapsed] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return (
    <AdminSidebarContext.Provider value={{ isCollapsed, setCollapsed, toggle }}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  if (context === undefined) {
    throw new Error('useAdminSidebar must be used within AdminSidebarProvider');
  }
  return context;
}
