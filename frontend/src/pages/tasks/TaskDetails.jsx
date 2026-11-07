import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import taskService from '../../services/taskService';
import { formatDate, getStatusColor } from '../../utils/formatters';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const loadTask = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTask(await taskService.getTaskById(id));
    } catch (requestError) {
      console.error('Failed to load task', requestError);
      setError('Task details could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleComplete = async () => {
    setUpdating(true);
    setError('');
    try {
      setTask(await taskService.markComplete(id));
    } catch (requestError) {
      console.error('Failed to complete task', requestError);
      setError('Task could not be marked complete.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    setUpdating(true);
    setError('');
    try {
      await taskService.deleteTask(id);
      navigate('/tasks', { replace: true });
    } catch (requestError) {
      console.error('Failed to delete task', requestError);
      setError('Task could not be deleted.');
      setUpdating(false);
    }
  };

  if (loading) return <div role="status" className="p-8 text-center text-subtext">Loading task...</div>;
  if (!task) {
    return (
      <div className="space-y-4 p-8 text-center">
        <p role="alert" className="text-error">{error || 'Task not found.'}</p>
        <Link to="/tasks" className="text-primary hover:underline">Back to Tasks</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-maintext">Task Details</h1>
        <Link to="/tasks" className="text-primary hover:underline">Back to Tasks</Link>
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}
      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-maintext">{task.name}</h2>
          <p className="mt-1 text-sm text-subtext">{task.description || 'No description provided.'}</p>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-subtext">Date</dt>
            <dd className="text-maintext">{task.date ? formatDate(task.date) : 'Not scheduled'}</dd>
          </div>
          <div>
            <dt className="text-sm text-subtext">Time</dt>
            <dd className="text-maintext">{task.time || 'Not scheduled'}</dd>
          </div>
          <div>
            <dt className="text-sm text-subtext">Assigned to</dt>
            <dd className="text-maintext">{task.assigned_person || 'Unassigned'}</dd>
          </div>
          <div>
            <dt className="text-sm text-subtext">Status</dt>
            <dd><span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(task.status)}`}>{task.status}</span></dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        {task.status !== 'Completed' && (
          <button type="button" disabled={updating} onClick={handleComplete} className="rounded-md bg-primary px-5 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-60">
            {updating ? 'Updating...' : 'Mark Complete'}
          </button>
        )}
        <button type="button" disabled={updating} onClick={handleDelete} className="rounded-md border border-error bg-white px-5 py-2 font-medium text-error hover:bg-red-50 disabled:opacity-60">
          Delete Task
        </button>
      </div>
    </div>
  );
};

export default TaskDetails;
