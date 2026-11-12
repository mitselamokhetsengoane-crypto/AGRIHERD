import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cropService from '../../services/cropService';
import { formatDate } from '../../utils/formatters';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { Plus, Sprout, ArrowRight, Calendar, MapPin, Download } from 'lucide-react';

const Crops = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const data = await cropService.getAllCrops();
        setCrops(data || []);
      } catch (error) {
        console.error('Failed to load crops:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  const handleDownloadReport = async () => {
    try {
      const response = await api.get('/crops/reports/export.xlsx', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'agriherd-crops.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download crop report.');
    }
  };

  if (loading) return <LoadingIndicator label="Loading crops & fields..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crops & Fields"
        subtitle="Monitor field plots, planting schedules, growth stages, and harvest yields."
      >
        <button 
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition mr-3"
        >
          <Download className="h-4 w-4" />
          <span>Download Report</span>
        </button>
        <Link
          to="/app/crops/add"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-primary-hover transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Crop</span>
        </Link>
      </PageHeader>

      {crops.length === 0 ? (
        <EmptyState
          icon={<Sprout className="h-8 w-8 text-secondary" />}
          title="No Crops Planted Yet"
          description="Register your first field crop to track its growth stages and harvest yields."
          actionText="Add First Crop"
          actionLink="/app/crops/add"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {crops.map((crop) => (
            <div
              key={crop.id}
              className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-secondary">
                      <Sprout className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-maintext line-clamp-1">
                        {crop.name}
                      </h3>
                      {crop.variety && (
                        <p className="text-xs text-subtext">{crop.variety}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={crop.status || 'Active'} size="xs" />
                </div>

                <div className="space-y-1.5 py-2 text-xs text-subtext border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{crop.field_name || 'Main Field'} {crop.field_size ? `(${crop.field_size})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>Planted: {formatDate(crop.planting_date)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-subtext">Field Plot</span>
                <Link
                  to={`/app/crops/${crop.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>Manage Records</span>
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

export default Crops;