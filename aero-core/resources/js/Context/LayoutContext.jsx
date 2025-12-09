import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const [sideBarOpen, setSideBarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const toggleSideBar = useCallback(() => setSideBarOpen(open => !open), []);

  useEffect(() => {
    localStorage.setItem('sidebar-open', JSON.stringify(sideBarOpen));
  }, [sideBarOpen]);

  const value = {
    sideBarOpen,
    toggleSideBar,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export default LayoutContext;
