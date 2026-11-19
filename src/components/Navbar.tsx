import React from 'react';

export type ActiveFeatureTab = 'post' | 'find' | 'request';

/**
 * Shared button styling guaranteeing identical background color, text color,
 * border radius, sizing, spacing, hover state, and active state across all
 * three primary action buttons.
 */
export const PRIMARY_ACTION_BUTTON_CLASS =
  'px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#146B32] hover:bg-[#0E4F24] active:bg-[#0A3B1B] rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146B32]';

interface NavbarProps {
  activeTab: ActiveFeatureTab;
  onSelectTab: (tab: ActiveFeatureTab) => void;
  onReturnToHero: () => void;
}

const PRIMARY_ACTIONS: Array<{ id: ActiveFeatureTab; label: string }> = [
  { id: 'post', label: 'Post a Found Item' },
  { id: 'find', label: 'Find a Lost Item' },
  { id: 'request', label: 'Request to Find a Lost Item' }
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onReturnToHero
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E5DFD6]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        {/* Brand Title — Returns smoothly to separate Hero Page */}
        <button
          type="button"
          onClick={onReturnToHero}
          className="self-start sm:self-center font-serif text-lg sm:text-xl font-semibold tracking-tight text-[#191816] hover:text-[#146B32] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146B32]"
        >
          VTU Lost &amp; Found
        </button>

        {/* Three Primary Action Buttons — Identical Color, Radius, Sizing & States */}
        <nav
          aria-label="Primary Campus Actions"
          className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-0.5 sm:pb-0"
        >
          {PRIMARY_ACTIONS.map((action) => {
            const isCurrent = activeTab === action.id;
            return (
              <div key={action.id} className="relative flex flex-col items-center shrink-0">
                <button
                  type="button"
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => onSelectTab(action.id)}
                  className={PRIMARY_ACTION_BUTTON_CLASS}
                >
                  {action.label}
                </button>
                <span
                  aria-hidden="true"
                  className={`mt-1 h-0.5 w-8 rounded-full transition-opacity duration-150 ${
                    isCurrent ? 'bg-[#DF6A18] opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
