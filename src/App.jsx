const { useState, useEffect } = React;

function App() {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        // Função para inicializar Firebase com autenticação
        const initFirebase = async () => {
            try {
                if (!window.firebase || !window.firebase.getFirestore) {
                    setError('Firebase não está carregado');
                    return;
                }

                const { getAuth, signInAnonymously, onAuthStateChanged, getFirestore, collection, query, onSnapshot } = window.firebase;
                
                // Configura autenticação
                const auth = getAuth();
                
                // Escuta mudanças no estado de autenticação
                onAuthStateChanged(auth, (user) => {
                    if (user) {
                        console.log('Usuário autenticado:', user.uid);
                        setAuthLoading(false);
                        
                        // Agora que está autenticado, busca os clientes
                        try {
                            const db = getFirestore();
                            const q = query(collection(db, 'solar-clients'));

                            const unsubscribe = onSnapshot(q, (snapshot) => {
                                const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                console.log('Clientes carregados:', clientsData.length);
                                setClients(clientsData);
                                setLoading(false);
                                setError(null);
                            }, (error) => {
                                console.error('Erro ao buscar clientes:', error);
                                setError('Erro ao carregar clientes: ' + error.message);
                                setLoading(false);
                            });

                            return () => unsubscribe && unsubscribe();
                        } catch (err) {
                            console.error('Erro ao configurar Firestore:', err);
                            setError('Erro ao configurar Firestore: ' + err.message);
                            setLoading(false);
                        }
                    } else {
                        console.log('Usuário não autenticado, fazendo login anônimo...');
                        // Se não está autenticado, faz login anônimo
                        signInAnonymously(auth).catch((error) => {
                            console.error('Erro no login anônimo:', error);
                            setError('Erro na autenticação: ' + error.message);
                            setAuthLoading(false);
                            setLoading(false);
                        });
                    }
                });

            } catch (err) {
                console.error('Erro ao inicializar Firebase:', err);
                setError('Erro ao inicializar: ' + err.message);
                setAuthLoading(false);
                setLoading(false);
            }
        };

        // Tenta inicializar imediatamente ou aguarda Firebase
        if (window.firebase && window.firebase.getFirestore) {
            initFirebase();
        } else {
            // Aguarda Firebase estar pronto
            let attempts = 0;
            const checkFirebase = () => {
                attempts++;
                if (window.firebase && window.firebase.getFirestore) {
                    initFirebase();
                } else if (attempts < 50) { // Máximo 5 segundos
                    setTimeout(checkFirebase, 100);
                } else {
                    setError('Timeout: Firebase não carregou');
                    setAuthLoading(false);
                    setLoading(false);
                }
            };
            checkFirebase();
        }
    }, []);

    if (error) {
        return (
            <div className="text-center p-10">
                <div className="text-red-600 mb-4">{error}</div>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Recarregar
                </button>
            </div>
        );
    }

    if (authLoading) {
        return <div className="text-center p-10">Autenticando...</div>;
    }

    if (loading) {
        return <div className="text-center p-10">Carregando clientes...</div>;
    }

    return (
        <div className="flex h-screen bg-gray-200">
            <div className="w-1/4 bg-white border-r overflow-y-auto">
                <ClientList
                    clients={clients}
                    selectedClient={selectedClient}
                    onSelectClient={setSelectedClient}
                />
            </div>
            <div className="w-3/4 overflow-y-auto p-6">
                <AnalysisDashboard client={selectedClient} />
            </div>
        </div>
    );
}

window.App = App;