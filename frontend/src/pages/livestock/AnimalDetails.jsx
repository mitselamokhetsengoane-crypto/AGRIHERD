import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import { getStatusColor } from '../../utils/formatters';

const AnimalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        const data = await livestockService.getAnimalById(id);
        setAnimal(data);
      } catch (error) {
        console.error("Failed to load animal", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimal();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this animal? This cannot be undone.")) {
      await livestockService.deleteAnimal(id);
      navigate('/livestock');
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading details...</div>;
  if (!animal) return <div className="p-8 text-center text-error">Animal not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/livestock" className="text-primary hover:underline text-sm">Back to Livestock</Link>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-maintext">{animal.name || animal.animal_id}</h1>
            <p className="text-subtext">{animal.type} • {animal.breed}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(animal.health_status)}`}>
            {animal.health_status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-sm text-subtext">Tag ID</p><p className="font-medium">{animal.animal_id}</p></div>
          <div><p className="text-sm text-subtext">Age</p><p className="font-medium">{animal.age || 'N/A'} yrs</p></div>
          <div><p className="text-sm text-subtext">Gender</p><p className="font-medium">{animal.gender}</p></div>
          <div><p className="text-sm text-subtext">Weight</p><p className="font-medium">{animal.weight ? `${animal.weight} kg` : 'N/A'}</p></div>
        </div>

        <div>
          <h3 className="font-semibold text-maintext mb-2">Notes</h3>
          <p className="text-subtext text-sm">{animal.notes || 'No notes recorded.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to={`/livestock/${id}/health`} className="bg-white p-4 text-center rounded-xl shadow-sm border border-gray-100 hover:border-primary transition text-sm font-medium text-maintext">Health Records</Link>
        <Link to={`/livestock/${id}/vaccinations`} className="bg-white p-4 text-center rounded-xl shadow-sm border border-gray-100 hover:border-primary transition text-sm font-medium text-maintext">Vaccinations</Link>
        <Link to={`/livestock/${id}/feeding`} className="bg-white p-4 text-center rounded-xl shadow-sm border border-gray-100 hover:border-primary transition text-sm font-medium text-maintext">Feeding</Link>
        <Link to={`/livestock/${id}/breeding`} className="bg-white p-4 text-center rounded-xl shadow-sm border border-gray-100 hover:border-primary transition text-sm font-medium text-maintext">Breeding</Link>
      </div>

      <div className="flex gap-4">
        <button onClick={handleDelete} className="flex-1 bg-white border border-error text-error py-2 rounded-md hover:bg-red-50">Delete Animal</button>
      </div>
    </div>
  );
};

export default AnimalDetails;