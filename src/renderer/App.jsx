const { useState, useEffect } = React;

// Componente para mostrar estatísticas de filtro (APENAS NA VISÃO GERAL)
const DataFilterStats = ({ totalClientsInDB, clientsWithHistory, clientsWithoutHistory }) => {
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-semibold flex items-center">
                        <span className="mr-2">🔍</span>
                        Filtro de Dados Aplicado
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                        Análise focada apenas em clientes com histórico de consumo
                    </p>
                </div>
                
                <div className="flex gap-6 text-sm">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{clientsWithHistory}</p>
                        <p className="text-gray-400">Com Histórico</p>
                        <p className="text-green-400 text-xs">✓ Incluídos</p>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-500">{clientsWithoutHistory}</p>
                        <p className="text-gray-400">Sem Histórico</p>
                        <p className="text-orange-400 text-xs">⚠️ Excluídos</p>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{totalClientsInDB}</p>
                        <p className="text-gray-400">Total no DB</p>
                        <p className="text-gray-500 text-xs">Base completa</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                <div className="flex items-center text-blue-300 text-sm">
                    <span className="mr-2">💡</span>
                    <span>
                        <strong>Filtro Ativo:</strong> Apenas clientes com histórico de consumo e valor pago são analisados. 
                        Isso garante análises precisas de oportunidades de expansão baseadas em dados reais.
                    </span>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [activeView, setActiveView] = useState('overview');
    const [clients, setClients] = useState([]);
    const [consumerUnits, setConsumerUnits] = useState([]);
    const [totalClientsInDB, setTotalClientsInDB] = useState(0);
    const [loading, setLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Firebase Auth
    useEffect(() => {
        const { getAuth, onAuthStateChanged, signInAnonymously } = window.firebase;
        const auth = getAuth();
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                signInAnonymously(auth).catch(error => console.error("Erro no login:", error));
            }
            setAuthReady(true);
        });
    }, []);

    // Carregamento de dados
    useEffect(() => {
        if (!authReady) return;

        const fetchData = async () => {
            setLoading(true);
            const { getFirestore, collection, query, getDocs } = window.firebase;
            const db = getFirestore();
            
            try {
                const clientsQuery = query(collection(db, 'solar-clients'));
                const querySnapshot = await getDocs(clientsQuery);

                const clientsData = [];
                const allConsumerUnits = [];
                
                setTotalClientsInDB(querySnapshot.docs.length);

                const clientProcessingPromises = querySnapshot.docs.map(async (doc) => {
                    const clientData = { id: doc.id, ...doc.data() };
                    
                    if (clientData.installDate && typeof clientData.installDate.toDate === 'function') {
                        clientData.installDate = clientData.installDate.toDate().toLocaleDateString('pt-BR');
                    }
                    
                    const ucsSnapshot = await getDocs(collection(db, `solar-clients/${doc.id}/consumerUnits`));
                    const clientUCs = [];
                    let hasHistoryData = false;
                    
                    ucsSnapshot.forEach(ucDoc => {
                        const ucData = { 
                            id: ucDoc.id, 
                            clientId: doc.id,
                            clientName: clientData.name,
                            clientNumber: clientData.clientNumber,
                            ...ucDoc.data() 
                        };
                        
                        if (ucData.history && Array.isArray(ucData.history) && ucData.history.length > 0) {
                            const hasValidHistory = ucData.history.some(entry => 
                                entry["Consumo(kWh)"] && parseFloat(entry["Consumo(kWh)"]) > 0 &&
                                entry["Valor"] && parseFloat(entry["Valor"]) > 0 &&
                                entry["Referência"] && entry["Referência"].includes('/')
                            );
                            if (hasValidHistory) {
                                hasHistoryData = true;
                            }
                        }
                        
                        clientUCs.push(ucData);
                        allConsumerUnits.push(ucData);
                    });
                    
                    clientData.consumerUnits = clientUCs;
                    clientData.totalBalance = clientUCs.reduce((sum, uc) => sum + (parseFloat(uc.balanceKWH) || 0), 0);
                    clientData.hasLowBalance = clientData.totalBalance < 100;
                    clientData.hasHistoryData = hasHistoryData;
                    
                    if (hasHistoryData) {
                        clientsData.push(clientData);
                    }
                });

                await Promise.all(clientProcessingPromises);
                
                setClients(clientsData);
                setConsumerUnits(allConsumerUnits);
                setLastUpdate(new Date());

            } catch (error) {
                console.error("Erro ao buscar dados do Firestore:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
    }, [authReady]);

    const views = [
        { id: 'overview', label: 'Visão Geral', icon: '📊' },
        { id: 'opportunities', label: 'Oportunidades', icon: '🎯' },
        { id: 'regional', label: 'Análise Regional', icon: '🗺️' },
        { id: 'trends', label: 'Tendências', icon: '📈' }
    ];

    if (!authReady || loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-white text-xl font-semibold">Carregando Analytics...</h2>
                    <p className="text-gray-400 mt-2">Processando dados dos clientes</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="text-2xl">⚡</div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Solar Analytics Dashboard</h1>
                                <p className="text-sm text-gray-400">Análise de Oportunidades de Negócio</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-400">
                                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                            </div>
                            <div className="text-sm text-gray-400">
                                {clients.length} analisados | {totalClientsInDB} total no DB
                            </div>
                            <div className="text-sm text-green-400">
                                {totalClientsInDB > 0 ? ((clients.length / totalClientsInDB) * 100).toFixed(1) : '0'}% com dados válidos
                            </div>
                        </div>
                    </div>
                    
                    <nav className="mt-4">
                        <div className="flex space-x-1">
                            {views.map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => setActiveView(view.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        activeView === view.id
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                    }`}
                                >
                                    <span className="mr-2">{view.icon}</span>
                                    {view.label}
                                </button>
                            ))}
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                {activeView === 'overview' && (
                    <>
                        <OverviewDashboard clients={clients} consumerUnits={consumerUnits} totalInDB={totalClientsInDB} />
                        
                        {/* Data Filter Statistics - APENAS NA VISÃO GERAL, NO FINAL */}
                        {totalClientsInDB > 0 && clients.length < totalClientsInDB && (
                            <div className="mt-8">
                                <DataFilterStats 
                                    totalClientsInDB={totalClientsInDB}
                                    clientsWithHistory={clients.length}
                                    clientsWithoutHistory={totalClientsInDB - clients.length}
                                />
                            </div>
                        )}
                    </>
                )}
                {activeView === 'opportunities' && <OpportunitiesDashboard clients={clients} consumerUnits={consumerUnits} />}
                {activeView === 'regional' && <RegionalDashboard clients={clients} />}
                {activeView === 'trends' && <TrendsDashboard clients={clients} consumerUnits={consumerUnits} />}
            </main>
        </div>
    );
}

window.App = App;