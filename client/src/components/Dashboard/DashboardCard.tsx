import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  badge?: string;
  badgeColor?: 'green' | 'blue' | 'yellow' | 'red';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  badge, 
  badgeColor = 'blue' 
}) => {
  const badgeColors = {
    green: 'bg-green-500 text-black',
    blue: 'bg-blue-500 text-black', 
    yellow: 'bg-yellow-500 text-black',
    red: 'bg-red-500 text-black'
  };

  return (
    <button
      onClick={onClick}
      className="w-full futuristic-card p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl shadow-lg shadow-cyan-400/50 group-hover:shadow-cyan-400/80 transition-all duration-300 border border-cyan-400/50">
              <Icon className="w-6 h-6 text-white" />
            </div>
            {badge && (
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeColors[badgeColor]} border border-cyan-400/50 font-mono`}>
                {badge}
              </span>
            )}
          </div>
          <h3 className="futuristic-header text-lg mb-2">{title}</h3>
          <p className="futuristic-text opacity-80 text-sm">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default DashboardCard;