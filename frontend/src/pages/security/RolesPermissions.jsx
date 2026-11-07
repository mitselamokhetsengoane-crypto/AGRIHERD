const RolesPermissions = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Roles & Permissions</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Role Permission Matrix</h3>
        <p className="text-sm text-gray-500 mb-4">Define what each role can read and write.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded p-4">
            <h4 className="font-bold text-primary mb-2">Farmer</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Read: Own Farm Data</li>
              <li>✅ Write: Own Farm Data</li>
              <li>❌ Read: Other Farms</li>
              <li>❌ Write: Security Settings</li>
            </ul>
          </div>
          <div className="border rounded p-4">
            <h4 className="font-bold text-secondary mb-2">Farm Worker</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Read: Assigned Tasks</li>
              <li>✅ Write: Task Status</li>
              <li>❌ Read: Financial Data</li>
              <li>❌ Write: Farm Records</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;