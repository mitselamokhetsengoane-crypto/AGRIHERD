import React from 'react';
import { Link } from 'react-router-dom';
import AppIcon from '../common/AppIcon';
import { ArrowUpRight } from 'lucide-react';

const QuickActionCard = ({
  to,
  icon,
  iconName,
  title,
  description,
  color = 'primary',
}) => {
  const colorMap = {
    primary: 'hover:border-primary text-primary group-hover:bg-primary-light',
    secondary: 'hover:border-secondary text-secondary group-hover:bg-emerald-50',
    navy: 'hover:border-navy text-navy group-hover:bg-slate-100',
    warning: 'hover:border-warning text-warning-dark group-hover:bg-amber-50',
  };

  const style = colorMap[color] || colorMap.primary;

  return (
    <Link
      to={to}
      className={`group relative flex items-start gap-3.5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 p-2.5 transition-colors">
        {icon ? icon : <AppIcon name={iconName} className="h-5 w-5" />}
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-sm font-bold text-maintext group-hover:text-primary transition-colors">
          {title}
        </h4>
        {description && (
          <p className="mt-0.5 text-xs text-subtext truncate">{description}</p>
        )}
      </div>

      <ArrowUpRight className="absolute right-3.5 top-3.5 h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
    </Link>
  );
};

export default QuickActionCard;
