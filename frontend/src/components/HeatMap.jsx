import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const HeatMap = ({ checkIns = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);

  const checkInDates = useMemo(() => {
    return new Set(
      checkIns.map(ci => {
        const d = new Date(ci.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
  }, [checkIns]);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${year}-${month}-${day}`;
      const isToday = date.getTime() === today.getTime();
      const isFuture = date > today;

      days.push({
        day,
        date,
        dateKey,
        completed: checkInDates.has(dateKey),
        isToday,
        isFuture,
      });
    }

    return days;
  }, [currentDate, checkInDates]);

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatFullDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Calculate stats for current month
  const monthStats = useMemo(() => {
    const completedDays = calendarData.filter(d => d?.completed).length;
    const totalDays = calendarData.filter(d => d && !d.isFuture).length;
    return { completedDays, totalDays };
  }, [calendarData]);

  const isCurrentMonth = () => {
    const today = new Date();
    return currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="select-none max-w-sm mx-auto">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <h3 className="text-sm font-semibold text-gray-900 ml-1">
            {formatMonthYear(currentDate)}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!isCurrentMonth() && (
            <button
              onClick={goToToday}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Today
            </button>
          )}
          <div className="text-xs text-gray-500">
            <span className="font-semibold text-emerald-600">{monthStats.completedDays}</span>
            <span className="text-gray-400">/{monthStats.totalDays}</span>
          </div>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map((label, idx) => (
          <div key={idx} className="text-center text-[10px] font-medium text-gray-400 py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((day, idx) => (
          <div
            key={idx}
            className={`
              relative w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-all duration-150
              ${!day ? 'bg-transparent' : ''}
              ${day && day.isFuture ? 'text-gray-300 bg-gray-50' : ''}
              ${day && !day.isFuture && !day.completed ? 'text-gray-600 bg-gray-100 hover:bg-gray-200' : ''}
              ${day && day.completed ? 'text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm' : ''}
              ${day?.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-gray-800' : ''}
              ${day && !day.isFuture ? 'cursor-pointer' : ''}
            `}
            onMouseEnter={() => day && !day.isFuture && setHoveredDay(day)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            {day && (
              <>
                <span className={day.completed ? 'opacity-0' : ''}>{day.day}</span>
                {day.completed && (
                  <Check className="w-3.5 h-3.5 absolute" strokeWidth={3} />
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <div className="w-3 h-3 rounded bg-gray-100" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <div className="w-3 h-3 rounded bg-emerald-500 flex items-center justify-center">
            <Check className="w-2 h-2 text-white" strokeWidth={3} />
          </div>
          <span>Done</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />
          <span>Future</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-600">
            {formatFullDate(hoveredDay.date)}
            {' — '}
            <span className={hoveredDay.completed ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
              {hoveredDay.completed ? 'Completed' : 'Not completed'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default HeatMap;
