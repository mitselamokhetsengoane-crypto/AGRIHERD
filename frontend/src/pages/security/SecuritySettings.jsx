const SecuritySettings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Security Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Password Policy</h3>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Require strong passwords (12+ chars)</span>
            <input type="checkbox" defaultChecked disabled className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Force password change every 90 days</span>
            <input type="checkbox" defaultChecked disabled className="w-4 h-4 text-primary" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Session Management</h3>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Auto-logout after 15 minutes</span>
            <input type="checkbox" defaultChecked disabled className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Enforce MFA for admins</span>
            <input type="checkbox" defaultChecked disabled className="w-4 h-4 text-primary" />
          </div>
        </div>

        <p className="text-sm text-gray-500">These policies are informational and cannot be changed from the app yet.</p>
      </div>
    </div>
  );
};

export default SecuritySettings;