import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taskService from '../../services/taskService';

const AddTask = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    assigned_person: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await taskService.createTask({
        ...formData,
        date: formData.date || null,
        time: formData.time || null,
        assigned_person: formData.assigned_person || null,
        status: 'Pending',
      });
      navigate('/tasks');
    } catch (requestError) {
      console.error('Failed to create task', requestError);
      setError('Task could not be saved. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Create Task</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}
        <div>
          <label htmlFor="task-name" className="mb-1 block text-sm text-subtext">Task name</label>
          <input id="task-name" name="name" required maxLength="255" value={formData.name} onChange={updateField} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label htmlFor="task-description" className="mb-1 block text-sm text-subtext">Description</label>
          <textarea id="task-description" name="description" rows="3" value={formData.description} onChange={updateField} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-date" className="mb-1 block text-sm text-subtext">Due date</label>
            <input id="task-date" name="date" type="date" value={formData.date} onChange={updateField} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary" />
          </div>
          <div>
            <label htmlFor="task-time" className="mb-1 block text-sm text-subtext">Time</label>
            <input id="task-time" name="time" type="time" value={formData.time} onChange={updateField} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary" />
          </div>
        </div>
        <div>
          <label htmlFor="assigned-person" className="mb-1 block text-sm text-subtext">Assigned to</label>
          <input id="assigned-person" name="assigned_person" maxLength="150" value={formData.assigned_person} onChange={updateField} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary" />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={loading} className="rounded-md bg-primary px-5 py-2 font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Saving...' : 'Create Task'}
          </button>
          <button type="button" onClick={() => navigate('/tasks')} className="rounded-md border border-gray-300 bg-white px-5 py-2 font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTask;
