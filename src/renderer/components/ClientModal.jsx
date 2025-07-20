const { useMemo, useEffect } = React;

// Componente do Gráfico de Consumo
const ConsumptionChart = ({ data, colors }) => {
    const ucGroups = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return {};
        }

        const groups = {};
        data.forEach(item => {
            if (!groups[item.ucName]) {
                groups[item.ucName] = [];
            }
            groups[item.ucName].push(item);
        });
        return groups;
    }, [data?.length]);

    const maxConsumption = useMemo(() => {
        if (!data || data.length === 0) return 0;
        return Math.max(...data.map(d => d.consumption));
    }, [data?.length]);

    const months = useMemo(() => {
        if (!data || data.length === 0) return [];
        return [...new Set(data.map(d => d.month))].sort((a, b) => {
            const [ma, ya] = a.split('/');
            const [mb, yb] = b.split('/');
            return new Date(ya, ma - 1) - new Date(yb, mb - 1);
        });
    }, [data?.length]);

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <p className="text-gray-400">Nenhum dado de consumo disponível</p>
            </div>
        );
    }

    return (
        <div className="w-full h-64">
            <div className="relative w-full h-full">
                {/* Eixo Y */}
                <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-400">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="text-right pr-2">
                            {Math.round((maxConsumption * (4 - i)) / 4)}
                        </div>
                    ))}
                </div>

                {/* Área do gráfico */}
                <div className="ml-16 mr-4 h-full relative border-l border-b border-gray-600">
                    {/* Linhas de grade */}
                    {[...Array(4)].map((_, i) => (
                        <div 
                            key={i}
                            className="absolute w-full border-t border-gray-700"
                            style={{ top: `${(i * 100) / 4}%` }}
                        ></div>
                    ))}

                    {/* Pontos das UCs */}
                    {Object.entries(ucGroups).map(([ucName, ucData], ucIndex) => (
                        <div key={ucName}>
                            {ucData.map((point, pointIndex) => {
                                const monthIndex = months.indexOf(point.month);
                                const x = ((monthIndex + 0.5) / months.length) * 100;
                                const y = 100 - ((point.consumption / maxConsumption) * 100);
                                
                                return (
                                    <div
                                        key={`${ucName}-${pointIndex}`}
                                        className="absolute w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform"
                                        style={{
                                            left: `${x}%`,
                                            top: `${y}%`,
                                            backgroundColor: colors[ucIndex % colors.length],
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                        title={`${ucName}: ${point.consumption} kWh em ${point.month}`}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Eixo X */}
                <div className="absolute bottom-0 left-16 right-4 h-8 flex justify-between items-end text-xs text-gray-400">
                    {months.map((month, index) => (
                        <div 
                            key={month}
                            className="transform -rotate-45 origin-bottom-left"
                            style={{ width: `${100 / months.length}%` }}
                        >
                            {month}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legenda */}
            <div className="mt-4 flex flex-wrap gap-4 justify-center">
                {Object.keys(ucGroups).map((ucName, index) => (
                    <div key={ucName} className="flex items-center gap-2">
                        <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span className="text-gray-300 text-sm">{ucName}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Componente Modal do Cliente
const ClientModal = ({ client, isOpen, onClose }) => {
    console.log('ClientModal renderizado:', { client, isOpen });
    
    // Debug: Monitorar mudanças no estado do modal
    useEffect(() => {
        console.log('Estado do modal mudou:', { isOpen, selectedClient: !!client });
        
        // Bloquear scroll quando modal abrir
        if (isOpen) {
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            console.log('Modal aberto - scroll bloqueado');
        } else {
            document.body.classList.remove('modal-open');
            document.body.style.overflow = 'auto';
            console.log('Modal fechado - scroll liberado');
        }
        
        // Cleanup na desmontagem
        return () => {
            document.body.classList.remove('modal-open');
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, client]);

    // Preparar dados do gráfico - sempre executar hooks
    const chartData = useMemo(() => {
        if (!client || !client.consumerUnits) {
            return [];
        }

        const allHistory = [];
        
        client.consumerUnits.forEach((uc) => {
            if (uc.history && Array.isArray(uc.history) && uc.history.length > 0) {
                uc.history.forEach(entry => {
                    if (entry["Consumo(kWh)"] && entry["Referência"]) {
                        allHistory.push({
                            month: entry["Referência"],
                            consumption: parseFloat(entry["Consumo(kWh)"]) || 0,
                            value: parseFloat(entry["Valor"]) || 0,
                            ucName: uc.name || uc.consumerUnitNumber || uc.consumerUnitName || `UC ${uc.id}`,
                            ucIndex: uc.consumerUnitNumber || uc.id
                        });
                    }
                });
            }
        });

        // Ordenar por data
        return allHistory.sort((a, b) => {
            const [ma, ya] = a.month.split('/');
            const [mb, yb] = b.month.split('/');
            return new Date(ya, ma - 1) - new Date(yb, mb - 1);
        });
    }, [client?.id, client?.consumerUnits?.length]);

    // Calcular métricas corrigidas
    const metrics = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return {
                uniqueMonths: 0,
                monthlyAvgConsumption: 0,
                monthlyAvgValue: 0,
                ucMetrics: {},
                totalDataPoints: 0
            };
        }

        // Períodos únicos analisados
        const uniqueMonths = [...new Set(chartData.map(item => item.month))];
        
        // Métricas por UC
        const ucMetrics = {};
        if (client && client.consumerUnits) {
            client.consumerUnits.forEach((uc) => {
                const ucNumber = uc.name || uc.consumerUnitNumber || uc.consumerUnitName || `UC ${uc.id}`;
                const ucHistory = chartData.filter(item => item.ucName === ucNumber);
                
                if (ucHistory.length > 0) {
                    ucMetrics[ucNumber] = {
                        monthlyAvgConsumption: ucHistory.reduce((sum, item) => sum + item.consumption, 0) / ucHistory.length,
                        monthlyAvgValue: ucHistory.reduce((sum, item) => sum + item.value, 0) / ucHistory.length,
                        monthsWithData: ucHistory.length,
                        balance: parseFloat(uc.balanceKWH) || 0
                    };
                }
            });
        }

        // Métricas gerais
        const totalConsumption = chartData.reduce((sum, item) => sum + item.consumption, 0);
        const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
        const monthlyAvgConsumption = uniqueMonths.length > 0 ? totalConsumption / uniqueMonths.length : 0;
        const monthlyAvgValue = uniqueMonths.length > 0 ? totalValue / uniqueMonths.length : 0;

        return {
            uniqueMonths: uniqueMonths.length,
            monthlyAvgConsumption,
            monthlyAvgValue,
            ucMetrics,
            totalDataPoints: chartData.length
        };
    }, [chartData.length, client?.id]);

    // Early return APÓS todos os hooks
    if (!isOpen || !client) {
        console.log('Modal NÃO será mostrado!', { isOpen, client: !!client });
        return null;
    }

    console.log('Modal SERÁ mostrado!');

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
                style={{
                    position: 'fixed',
                    top: '0px',
                    left: '0px',
                    right: '0px',
                    bottom: '0px',
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}
                onClick={(e) => {
                    // Fechar modal se clicar no backdrop
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <div 
                    className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    style={{
                        backgroundColor: '#1f2937',
                        borderRadius: '0.5rem',
                        border: '1px solid #374151',
                        maxWidth: '56rem',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative',
                        zIndex: 1000000
                    }}
                    onClick={(e) => {
                        // Impedir que cliques no modal fechem ele
                        e.stopPropagation();
                    }}
                >
                    {/* Header do Modal */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {client.clientNumber && `${client.clientNumber} - `}{client.name}
                            </h2>
                            <p className="text-gray-400 mt-1">{client.address || 'Endereço não informado'}</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Conteúdo do Modal */}
                    <div className="p-6 space-y-6">
                        {/* Informações Básicas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Potência Instalada</p>
                                <p className="text-white text-2xl font-bold">{client.power} kWp</p>
                            </div>
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Saldo Total</p>
                                <p className="text-white text-2xl font-bold">{(client.totalBalance || 0).toFixed(0)} kWh</p>
                            </div>
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-gray-400 text-sm">Status</p>
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    client.status === 'active' ? 'bg-green-900/30 text-green-300' :
                                    client.status === 'expired' ? 'bg-red-900/30 text-red-300' :
                                    'bg-blue-900/30 text-blue-300'
                                }`}>
                                    {client.status === 'active' ? 'Em Garantia' :
                                     client.status === 'expired' ? 'Expirada' :
                                     client.status || 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Unidades Consumidoras */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Unidades Consumidoras ({client.consumerUnits?.length || 0})</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {client.consumerUnits && Array.isArray(client.consumerUnits) ? client.consumerUnits.map((uc, index) => {
                                    const ucNumber = uc.name || uc.consumerUnitNumber || uc.consumerUnitName || `UC ${uc.id}`;
                                    const ucStats = metrics.ucMetrics[ucNumber];
                                    
                                    return (
                                        <div key={uc.id || index} className="bg-gray-700/50 p-4 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-white font-medium">
                                                    {ucNumber}
                                                </h4>
                                                <div 
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: colors[index % colors.length] }}
                                                ></div>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <p className="text-gray-400">
                                                    Saldo: <span className="text-white">{(parseFloat(uc.balanceKWH) || 0).toFixed(0)} kWh</span>
                                                </p>
                                                <p className="text-gray-400">
                                                    Registros: <span className="text-white">
                                                        {uc.history?.length || 0} entradas
                                                    </span>
                                                </p>
                                                {ucStats && (
                                                    <>
                                                        <p className="text-gray-400">
                                                            Consumo médio: <span className="text-white">
                                                                {ucStats.monthlyAvgConsumption.toFixed(0)} kWh/mês
                                                            </span>
                                                        </p>
                                                        <p className="text-gray-400">
                                                            Valor médio: <span className="text-white">
                                                                R$ {ucStats.monthlyAvgValue.toFixed(0)}/mês
                                                            </span>
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-2 text-center py-4">
                                        <p className="text-gray-400">Nenhuma unidade consumidora encontrada</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gráfico de Histórico */}
                        {chartData.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Histórico de Consumo</h3>
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                    <ConsumptionChart data={chartData} colors={colors} />
                                </div>
                            </div>
                        )}

                        {/* Resumo Financeiro Corrigido */}
                        {chartData.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Resumo da Análise</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <p className="text-gray-400 text-sm">Consumo Médio Mensal</p>
                                        <p className="text-white text-xl font-bold">
                                            {metrics.monthlyAvgConsumption.toFixed(0)} kWh
                                        </p>
                                        <p className="text-gray-500 text-xs">Todas as UCs</p>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <p className="text-gray-400 text-sm">Valor Médio Mensal</p>
                                        <p className="text-white text-xl font-bold">
                                            R$ {metrics.monthlyAvgValue.toFixed(0)}
                                        </p>
                                        <p className="text-gray-500 text-xs">Todas as UCs</p>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <p className="text-gray-400 text-sm">Período Analisado</p>
                                        <p className="text-white text-xl font-bold">{metrics.uniqueMonths} meses</p>
                                        <p className="text-gray-500 text-xs">{metrics.totalDataPoints} registros totais</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detalhamento por UC */}
                        {Object.keys(metrics.ucMetrics || {}).length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Detalhamento por UC</h3>
                                <div className="space-y-3">
                                    {Object.entries(metrics.ucMetrics).map(([ucNumber, stats], index) => (
                                        <div key={ucNumber} className="bg-gray-700/50 p-4 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-white font-medium flex items-center">
                                                    <div 
                                                        className="w-3 h-3 rounded-full mr-2"
                                                        style={{ backgroundColor: colors[index % colors.length] }}
                                                    ></div>
                                                    {ucNumber}
                                                </h4>
                                                <span className="text-gray-400 text-sm">{stats.monthsWithData} registros</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-400">Consumo médio</p>
                                                    <p className="text-white font-medium">{(stats.monthlyAvgConsumption || 0).toFixed(0)} kWh</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Valor médio</p>
                                                    <p className="text-white font-medium">R$ {(stats.monthlyAvgValue || 0).toFixed(0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Saldo atual</p>
                                                    <p className="text-white font-medium">{(stats.balance || 0).toFixed(0)} kWh</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Status</p>
                                                    <p className={`font-medium ${
                                                        (stats.balance || 0) === 0 ? 'text-red-400' :
                                                        (stats.balance || 0) < 50 ? 'text-orange-400' :
                                                        'text-green-400'
                                                    }`}>
                                                        {(stats.balance || 0) === 0 ? 'Zero' :
                                                         (stats.balance || 0) < 50 ? 'Baixo' : 'OK'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS adicional para garantir que o modal apareça */}
            {isOpen && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                        .modal-overlay {
                            position: fixed !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100vw !important;
                            height: 100vh !important;
                            background-color: rgba(0, 0, 0, 0.8) !important;
                            z-index: 999999 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                        }
                        body.modal-open {
                            overflow: hidden !important;
                        }
                    `
                }} />
            )}
        </>
    );
};

// Disponibilizar globalmente
window.ClientModal = ClientModal;