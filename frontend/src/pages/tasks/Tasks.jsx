import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import taskService from '../../services/taskService';
import { formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Plus, CalendarDays, Eye, Trash2 } from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await taskService.getAllTasks();
      setTasks(data || []);
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

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await taskService.deleteTask(deletingId);
      setDeletingId(null);
      await fetchTasks();
    } catch (requestError) {
      console.error('Error deleting task', requestError);
      setError('Task could not be deleted. Please try again.');
    }
  };

  const columns = [
    {
      header: 'Task Name',
      accessor: 'name',
      render: (task) => (
        <div>
          <p className="font-bold text-maintext text-sm">{task.name}</p>
          {task.description && (
            <p className="text-xs text-subtext line-clamp-1">{task.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Target Date',
      accessor: 'date',
      render: (task) => (
        <span className="text-xs text-subtext font-medium">
          {task.date || task.due_date ? formatDate(task.date || task.due_date) : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (task) => <StatusBadge status={task.status || 'Pending'} size="xs" />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (task) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/app/tasks/${task.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-maintext hover:bg-gray-50 transition"
          >
            <Eye className="h-3.5 w-3.5 text-subtext" />
            <span>View</span>
          </Link>
          <button
            type="button"
            onClick={() => setDeletingId(task.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50/60 px-2.5 py-1 text-xs font-semibold text-error hover:bg-red-100 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingIndicator label="Loading tasks..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farm Task Scheduling"
        subtitle="Manage farm duties, feeding schedules, planting routines, and harvest timelines."
      >
        <div className="flex items-center gap-3">
          <Link
            to="/app/tasks/calendar"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-maintext shadow-sm hover:bg-gray-50 transition"
          >
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>Calendar View</span>
          </Link>
          <Link
            to="/app/tasks/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-primary-hover transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Link>
        </div>
      </PageHeader>

      {error && <ErrorMessage message={error} onRetry={fetchTasks} />}

      <DataTable
        columns={columns}
        data={tasks}
        emptyTitle="No Tasks Scheduled"
        emptyMessage="Create a task to keep track of daily and seasonal farm activities."
        emptyActionText="Create First Task"
        emptyActionLink="/app/tasks/add"
      />

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Farm Task"
        message="Are you sure you want to permanently delete this task? This action cannot be undone."
        confirmText="Delete Task"
        isDanger={true}
      />
    </div>
  );
};

export default Tasks;
