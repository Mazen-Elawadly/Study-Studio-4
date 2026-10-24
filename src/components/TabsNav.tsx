import React from 'react';
import { TOOLS } from '../constants/data';

interface TabsNavProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabsNav: React.FC<TabsNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <div className="tabs-wrap">
      <div className="tabs" role="tablist">
        {TOOLS.map(([id, label]) => (
          <button
            key={id}
            className="tab"
            role="tab"
            data-tab={id}
            aria-selected={currentTab === id}
            onClick={() => onTabChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
