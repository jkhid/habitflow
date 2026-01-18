import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Flame, Target, ChevronRight, Undo2 } from 'lucide-react';
import { Card, Button } from './ui';

const HabitCard = ({ habit, onCheckIn, onUndoCheckIn }) => {
  const navigate = useNavigate();
  const [showUndo, setShowUndo] = useState(false);
  const { id, name, description, currentStreak, longestStreak, completedToday, frequencyGoal, todayCheckIn } = habit;

  const handleCheckIn = (e) => {
    e.stopPropagation();
    if (!completedToday) {
      onCheckIn(id);
    }
  };

  const handleUndo = (e) => {
    e.stopPropagation();
    if (onUndoCheckIn && todayCheckIn?.id) {
      onUndoCheckIn(id, todayCheckIn.id);
      setShowUndo(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/habit/${id}`);
  };

  return (
    <Card
      className="hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
          )}
        </div>
        <div className="ml-3 flex-shrink-0 flex items-center gap-2">
          {completedToday && onUndoCheckIn && (
            <button
              onClick={handleUndo}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Undo check-in"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}
          <Button
            variant={completedToday ? 'success' : 'secondary'}
            size="sm"
            onClick={handleCheckIn}
            className={completedToday ? 'cursor-default' : ''}
          >
            <Check className={`w-4 h-4 ${completedToday ? '' : 'mr-1'}`} />
            {!completedToday && 'Check in'}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${currentStreak > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
            <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{currentStreak}</p>
            <p className="text-xs text-gray-500">Current streak</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{longestStreak}</p>
            <p className="text-xs text-gray-500">Best streak</p>
          </div>
        </div>

        <div className="ml-auto text-right">
          <p className="text-sm text-gray-500">Goal</p>
          <p className="text-sm font-medium text-gray-700">{frequencyGoal}x / week</p>
        </div>
      </div>

      {currentStreak >= 7 && (
        <div className="mt-4 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
          <p className="text-sm text-orange-700 font-medium flex items-center gap-2">
            <Flame className="w-4 h-4" />
            {currentStreak >= 30 ? 'Incredible! 30+ day streak!' :
             currentStreak >= 14 ? 'Amazing! 2+ week streak!' :
             'Great job! 1+ week streak!'}
          </p>
        </div>
      )}
    </Card>
  );
};

export default HabitCard;
