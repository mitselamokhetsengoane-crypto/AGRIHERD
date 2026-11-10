import { useState, useEffect } from 'react';
import api from '../../services/api';

const BlockchainMonitor = () => {
    const [status, setStatus] = useState(null);
    const [chain, setChain] = useState(null);
    const [loading, setLoading] = useState(false);

    const checkStatus = async () => {
        try {
            const res = await api.get('/blockchain/status');
            setStatus(res.data);
        } catch (e) {
            setStatus({ connected: false });
        }
    };

    const verifyChain = async () => {
        setLoading(true);
        try {
            const res = await api.get('/blockchain/verify');
            setChain(res.data);
        } catch (e) {
            setChain({ status: 'ERROR', verified: false });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        verifyChain();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Blockchain Monitor</h1>
            
            <div className={`p-4 rounded-lg border ${status?.connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="font-medium">
                    Node.js Engine: {status?.connected ? 'Online' : 'Offline'}
                </p>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Chain Integrity</h3>
                    <button 
                        onClick={verifyChain} 
                        disabled={loading}
                        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-800 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Re-verify'}
                    </button>
                </div>
                
                {chain && (
                    <div className="space-y-2">
                        <p>Status: <span className={`font-bold ${chain.verified ? 'text-green-600' : 'text-red-600'}`}>{chain.status}</span></p>
                        <p>Total Blocks: {chain.totalBlocks}</p>
                        <p>{chain.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockchainMonitor;