const DataClassification = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Data Classification</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-green-700 mb-2">Public Data</h3>
          <p className="text-gray-600 text-sm">Marketplace listings, product prices, farm names.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-yellow-600 mb-2">Private Data</h3>
          <p className="text-gray-600 text-sm">User profiles, farm locations, contact details.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-orange-600 mb-2">Confidential Data</h3>
          <p className="text-gray-600 text-sm">Crop yields, livestock health, AI scan results.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Restricted Data</h3>
          <p className="text-gray-600 text-sm">Financial transactions, passwords, blockchain keys.</p>
        </div>
      </div>
    </div>
  );
};

export default DataClassification;