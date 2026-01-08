import { createContext, useContext, useState, type ReactNode } from 'react';

interface SidebarContextType {
  sidebarShow: boolean;
  setSidebarShow: (show: boolean) => void;
  toggleSidebar: () => void;
  sidebarUnfoldable: boolean;
  setSidebarUnfoldable: (unfoldable: boolean) => void;
  toggleUnfoldable: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarShow, setSidebarShow] = useState(true);
  const [sidebarUnfoldable, setSidebarUnfoldable] = useState(false);

  const toggleSidebar = () => {
    setSidebarShow(prev => !prev);
  };

  const toggleUnfoldable = () => {
    setSidebarUnfoldable(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ 
      sidebarShow, 
      setSidebarShow, 
      toggleSidebar,
      sidebarUnfoldable,
      setSidebarUnfoldable,
      toggleUnfoldable
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
