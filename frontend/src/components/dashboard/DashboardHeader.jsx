import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';

const DashboardHeader = ({
  greeting,
  userName = 'Farmer',
  farmName,
  role = 'Farmer',
  subtitle = 'Here is the current operational overview for today.',
  children,
}) => {
  const getGreeting = () => {
    if (greeting) return greeting;
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-maintext sm:text-3xl">
            {getGreeting()}, {userName}
          </h1>
          {farmName && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              {farmName}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-subtext">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-subtext shadow-sm">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{todayFormatted}</span>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardHeader;
