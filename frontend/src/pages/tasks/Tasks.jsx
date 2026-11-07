import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import taskService from '../../services/taskService';
import { formatDate, getStatusColor } from '../../utils/formatters';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await taskService.getAllTasks();
      setTasks(data);
    } catch (requestError) {
      console.error('Error fetching tasks', requestError);
      setError('Tasks could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setError('');
      setLoading(true);
      try {
      await taskService.deleteTask(id);
        await fetchTasks();
      } catch (requestError) {
        console.error('Error deleting task', requestError);
        setError('Task could not be deleted. Please try again.');
        setLoading(false);
      }
    }
  };

  if (loading) return <div role="status" className="p-4 text-primary">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">All Tasks</h1>
        <div className="space-x-3">
          <Link to="/tasks/calendar" className="text-primary hover:underline">
            View Calendar
          </Link>
          <Link to="/tasks/add" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-800 transition">
            + Add Task
          </Link>
        </div>
      </div>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-subtext text-sm border-b">
            <tr>
              <th className="p-4 font-medium">Task Name</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-background transition">
                <td className="p-4 font-medium text-maintext">{task.name}</td>
                <td className="p-4 text-subtext">{formatDate(task.date)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-3">
                  <Link to={`/tasks/${task.id}`} className="text-primary hover:underline text-sm">
                    View
                  </Link>
                  <button type="button" onClick={() => handleDelete(task.id)} className="text-error hover:underline text-sm">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!error && tasks.length === 0 && (
          <div className="p-8 text-center text-subtext">No tasks found. Create your first task to get started.</div>
        )}
      </div>
    </div>
  );
};

export default Tasks;