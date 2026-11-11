import { Link } from 'react-router-dom';
import AppIcon from '../common/AppIcon';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

const colorThemes = {
  primary: {
    iconBg: 'bg-primary-light text-primary',
    value: 'text-primary',
  },
  secondary: {
    iconBg: 'bg-emerald-50 text-secondary',
    value: 'text-secondary',
  },
  navy: {
    iconBg: 'bg-slate-100 text-navy',
    value: 'text-navy',
  },
  warning: {
    iconBg: 'bg-amber-50 text-warning-dark',
    value: 'text-amber-700',
  },
  error: {
    iconBg: 'bg-red-50 text-error',
    value: 'text-error',
  },
  neutral: {
    iconBg: 'bg-gray-100 text-subtext',
    value: 'text-maintext',
  },
};

const StatCard = ({
  title,
  value,
  icon,
  iconName,
  color = 'primary',
  trend,
  subtitle,
  link,
  className = '',
}) => {
  const theme = colorThemes[color] || colorThemes.primary;

  const content = (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-gray-200 hover:shadow-md ${
        link ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-subtext uppercase">
            {title}
          </p>
          <p className={`text-2xl font-bold tracking-tight sm:text-3xl ${theme.value}`}>
            {value !== undefined && value !== null ? value : '—'}
          </p>
        </div>
        {(icon || iconName) && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2.5 transition-transform group-hover:scale-105 ${theme.iconBg}`}
          >
            {icon ? (
              icon
            ) : (
              <AppIcon name={iconName} className="h-5 w-5" strokeWidth={2} />
            )}
          </div>
        )}
      </div>

      {(trend || subtitle || link) && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3 text-xs">
          {trend ? (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}
              </span>
              {trend.label && <span className="text-subtext">{trend.label}</span>}
            </div>
          ) : subtitle ? (
            <span className="text-subtext">{subtitle}</span>
          ) : (
            <span />
          )}

          {link && (
            <span className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline">
              View
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }

  return content;
};

export default StatCard;
