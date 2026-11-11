import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import SearchInput from '../../components/common/SearchInput';
import EmptyState from '../../components/common/EmptyState';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { Plus, Beef, ArrowRight, Tag, HeartPulse } from 'lucide-react';

const Livestock = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const data = await livestockService.getAllAnimals();
        setAnimals(data || []);
      } catch (error) {
        console.error('Failed to load animals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimals();
  }, []);

  const filteredAnimals = animals.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.animal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingIndicator label="Loading livestock registry..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Livestock Registry"
        subtitle="Track farm animals, ear tags, breeds, health status, and breeding records."
      >
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
            placeholder="Search by tag, name, breed..."
            className="w-full sm:w-64"
          />
          <Link
            to="/app/livestock/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-primary-hover transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Animal</span>
          </Link>
        </div>
      </PageHeader>

      {filteredAnimals.length === 0 ? (
        <EmptyState
          icon={<Beef className="h-8 w-8 text-primary" />}
          title={searchTerm ? 'No Matching Animals' : 'No Livestock Registered'}
          description={
            searchTerm
              ? 'Try searching with a different ear tag, name, or breed.'
              : 'Add your cattle, sheep, goats, pigs, or poultry to start managing your herd.'
          }
          actionText={searchTerm ? 'Clear Search' : 'Add First Animal'}
          onAction={searchTerm ? () => setSearchTerm('') : undefined}
          actionLink={!searchTerm ? '/app/livestock/add' : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAnimals.map((animal) => (
            <div
              key={animal.id}
              className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                      <Beef className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-maintext line-clamp-1">
                        {animal.name || animal.tag_number || animal.animal_id}
                      </h3>
                      <p className="text-xs text-subtext">{animal.type} &bull; {animal.breed || 'Standard'}</p>
                    </div>
                  </div>
                  <StatusBadge status={animal.health_status || 'Healthy'} size="xs" />
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 text-xs text-subtext border-t border-gray-50">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-gray-400">Tag / ID</span>
                    <span className="font-semibold text-maintext">{animal.tag_number || animal.animal_id || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-gray-400">Gender / Age</span>
                    <span className="font-semibold text-maintext">
                      {animal.gender || '—'} {animal.age ? `(${animal.age})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-subtext">Health & Records</span>
                <Link
                  to={`/app/livestock/${animal.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>Manage Animal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Livestock;
