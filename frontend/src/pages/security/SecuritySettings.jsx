import { useCallback, useEffect, useState } from 'react';
import securityService from '../../services/securityService';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const settingLabels = {
  require_farmer_approval: 'Require admin approval for new farmer accounts',
  password_min_length: 'Minimum password length',
  password_require_uppercase: 'Require uppercase letter in passwords',
  password_require_lowercase: 'Require lowercase letter in passwords',
  password_require_number: 'Require number in passwords',
  password_require_special: 'Require special character in passwords',
  password_expiry_days: 'Force password change every N days',
  session_auto_logout_minutes: 'Auto-logout after N minutes',
  session_token_lifetime_minutes: 'Access token lifetime in minutes',
  login_rate_limit_per_minute: 'Login attempts per minute',
  api_rate_limit_per_minute: 'API requests per minute',
  enforce_mfa_for_admins: 'Require MFA for administrators',
};

const SecuritySettings = () => {
  const [settings, setSettings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState('');
  const [healthLoading, setHealthLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await securityService.getSystemSettings();
      setSettings(rows);
      setDrafts(Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value])));
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    securityService.getSystemHealth()
      .then(setHealth)
      .catch((err) => setHealthError(err.response?.data?.detail || 'System health could not be loaded.'))
      .finally(() => setHealthLoading(false));
  }, []);

  const handleToggle = async (key, current) => {
    setSaving(key);
    try {
      await securityService.updateSystemSetting(key, current === 'true' ? 'false' : 'true');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update setting.');
    } finally {
      setSaving(null);
    }
  };

  const handleChange = async (key, value) => {
    setSaving(key);
    try {
      await securityService.updateSystemSetting(key, value);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update setting.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingIndicator label="Loading security settings..." />;

  const booleanSettings = settings.filter((s) => s.setting_value === 'true' || s.setting_value === 'false');
  const numericSettings = settings.filter((s) => /^\d+$/.test(s.setting_value));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Security Settings</h1>
          <p className="text-gray-500 mt-1">System security policies. All values are stored in the database and enforced by the backend where applicable.</p>
        </div>
        <button type="button" onClick={load} disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-semibold underline">Retry</button>
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">System health</h2>
        {healthLoading ? (
          <p className="mt-3 text-sm text-gray-500">Checking database connectivity and table counts...</p>
        ) : healthError ? (
          <p role="alert" className="mt-3 text-sm text-red-700">{healthError}</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <p>Database: <strong className={health.database_connected ? 'text-green-700' : 'text-red-700'}>
                {health.database_connected ? 'Connected' : 'Unavailable'}
              </strong></p>
              <p>Migration 012 schema: <strong className={health.migration_012_applied ? 'text-green-700' : 'text-red-700'}>
                {health.migration_012_applied ? 'Detected' : 'Missing or incomplete'}
              </strong></p>
              <p>Migration 014 schema: <strong className={health.migration_014_applied ? 'text-green-700' : 'text-red-700'}>
                {health.migration_014_applied ? 'Detected' : 'Missing or incomplete'}
              </strong></p>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(health.table_counts).map(([table, count]) => (
                <div key={table} className="rounded-lg bg-gray-50 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-gray-500">{table.replaceAll('_', ' ')}</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{count == null ? 'Unavailable' : count}</dd>
                </div>
              ))}
            </dl>
            {health.unavailable_tables.length > 0 && (
              <p role="alert" className="mt-4 text-sm text-amber-800">
                Unavailable tables: {health.unavailable_tables.join(', ')}.
              </p>
            )}
          </>
        )}
      </section>

      {settings.length === 0 && !error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          No security settings were returned from the database. Apply
          {' '}<code>database/migrations/012_admin_dashboard_and_product_images.sql</code>
          {' '}after the existing migrations, then refresh.
          <button type="button" onClick={load} className="ml-3 font-semibold underline">Retry</button>
        </div>
      ) : settings.length > 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Toggles</h3>
          {booleanSettings.length === 0 && <p className="text-sm text-gray-500">No toggle settings are configured.</p>}
          {booleanSettings.map((s) => {
            const checked = s.setting_value === 'true';
            return (
              <div key={s.setting_key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-gray-700">{settingLabels[s.setting_key] || s.setting_key}</p>
                  {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(s.setting_key, s.setting_value)}
                  role="switch"
                  aria-checked={checked}
                  aria-label={settingLabels[s.setting_key] || s.setting_key}
                  disabled={saving === s.setting_key}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'} disabled:opacity-60`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            );
          })}

          <h3 className="text-lg font-semibold text-gray-800 pt-4">Values</h3>
          {numericSettings.length === 0 && <p className="text-sm text-gray-500">No numeric settings are configured.</p>}
          {numericSettings.map((s) => (
            <div key={s.setting_key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <p className="text-gray-700">{settingLabels[s.setting_key] || s.setting_key}</p>
              <input
                type="number"
                value={drafts[s.setting_key] ?? s.setting_value}
                onChange={(e) => setDrafts((current) => ({ ...current, [s.setting_key]: e.target.value }))}
                onBlur={() => {
                  if (drafts[s.setting_key] !== s.setting_value) handleChange(s.setting_key, drafts[s.setting_key]);
                }}
                disabled={saving === s.setting_key}
                className="w-24 border border-gray-300 rounded px-3 py-1 text-right"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SecuritySettings;