import React from 'react';

export interface DashboardTabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number | string;
}

export interface DashboardTabsProps {
  tabs: DashboardTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={
              isActive
                ? {
                    backgroundColor: 'var(--primary, #0F766E)',
                  }
                : undefined
            }
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? 'text-white shadow-lg ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
