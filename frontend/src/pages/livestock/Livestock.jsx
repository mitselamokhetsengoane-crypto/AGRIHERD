import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import { getStatusColor } from '../../utils/formatters';

const Livestock = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const data = await livestockService.getAllAnimals();
        setAnimals(data);
      } catch (error) {
        console.error("Failed to load animals", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimals();
  }, []);

  const filteredAnimals = animals.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.animal_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-subtext">Loading livestock...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-maintext">Livestock</h1>
        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search animals..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-64 focus:outline-none focus:border-primary"
          />
          <Link to="/livestock/add" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-800 transition whitespace-nowrap">
            + Add Animal
          </Link>
        </div>
      </div>

      {filteredAnimals.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No animals found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => (
            <div key={animal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-maintext">{animal.name || animal.animal_id}</h3>
                  <p className="text-sm text-subtext">{animal.breed || 'Unknown Breed'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(animal.health_status)}`}>
                  {animal.health_status || 'Unknown'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-subtext">
                <p>Type: <span className="text-maintext font-medium">{animal.type}</span></p>
                <p>Age: <span className="text-maintext font-medium">{animal.age || 'N/A'}</span></p>
              </div>
              <Link 
                to={`/livestock/${animal.id}`}
                className="block text-center bg-background text-primary font-medium py-2 rounded-md hover:bg-primary hover:text-white transition mt-4"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Livestock;