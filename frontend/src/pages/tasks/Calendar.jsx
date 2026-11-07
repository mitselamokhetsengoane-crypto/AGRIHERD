import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import taskService from '../../services/taskService';

const Calendar = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTasks(await taskService.getAllTasks());
    } catch (requestError) {
      console.error('Failed to load calendar tasks', requestError);
      setError('Calendar tasks could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const days = useMemo(() => {
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const numberOfDays = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: numberOfDays }, (_, index) => index + 1),
    ];
  }, [month, year]);

  const tasksByDay = tasks.reduce((grouped, task) => {
    if (task.date) {
      const taskDate = new Date(`${task.date}T00:00:00`);
      if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
        const day = taskDate.getDate();
        grouped[day] = [...(grouped[day] || []), task];
      }
    }
    return grouped;
  }, {});

  const monthLabel = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Task Calendar: {monthLabel}</h1>
        <Link to="/tasks" className="text-primary hover:underline">Back to Tasks</Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}
        {loading && <p role="status" className="mb-4 text-sm text-subtext">Loading calendar tasks...</p>}
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-subtext mb-4">
          <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => (
            <div key={day ? `day-${day}` : `empty-${index}`} className="min-h-[80px] rounded-md border border-gray-100 p-2">
              {day && <span className="text-xs font-bold text-maintext">{day}</span>}
              {day && (tasksByDay[day] || []).map((task) => (
                <Link key={task.id} to={`/tasks/${task.id}`} className="mt-1 block truncate rounded bg-secondary px-1 py-0.5 text-left text-[10px] text-white hover:bg-primary" title={task.name}>
                  {task.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;