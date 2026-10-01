import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs: React.FC<{ defaultValue: string; children: React.ReactNode; className?: string }> = ({ 
  defaultValue, 
  children,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-1 border-b border-white/10 ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ 
  value, 
  children,
  className = ''
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.activeTab === value;

  return (
    <button
      onClick={() => context.setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
        isActive 
          ? 'border-zinc-100 text-zinc-100' 
          : 'border-transparent text-zinc-400 hover:text-zinc-200'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ 
  value, 
  children,
  className = ''
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeTab !== value) return null;

  return <div className={`pt-4 ${className}`}>{children}</div>;
};
