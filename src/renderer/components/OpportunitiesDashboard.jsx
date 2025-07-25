const { useMemo, useState, useEffect } = React;

const OpportunitiesDashboard = ({ clients, consumerUnits }) => {
    const [sortBy, setSortBy] = useState('balance');
    const [sortDirection, setSortDirection] = useState('asc');
    const [filterType, setFilterType] = useState('all');
    const [selectedClient, setSelectedClient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Debug: Monitorar mudanças no estado do modal
    useEffect(() => {
        console.log('Estado do modal mudou:', { isModalOpen, selectedClient });
    }, [isModalOpen, selectedClient]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (column) => {
        if (sortBy !== column) return '↕️';
        return sortDirection === 'asc' ? '🔼' : '🔽';
    };

    const handleClientClick = (client) => {
        console.log('Cliente clicado:', client);
        console.log('Estado atual - isModalOpen:', isModalOpen, 'selectedClient:', selectedClient);
        
        // Garantir que o estado seja limpo antes de definir o novo
        setIsModalOpen(false);
        setSelectedClient(null);
        
        // Aguardar um tick antes de definir o novo estado
        setTimeout(() => {
            setSelectedClient(client);
            setIsModalOpen(true);
            console.log('Novo estado definido - Modal deveria aparecer agora');
        }, 50);
    };

    const opportunities = useMemo(() => {
        return clients
            .map(client => {
                const balance = client.totalBalance || 0;
                const power = parseFloat(String(client.power || '0').replace(',', '.')) || 0;
                const hasHistory = client.hasHistoryData || false;
                
                if (!hasHistory) {
                    return null;
                }
                
                let monthlyConsumption = 0;
                let monthlyPaid = 0;
                
                if (hasHistory) {
                    client.consumerUnits?.forEach(uc => {
                        if (uc.history?.length > 0) {
                            const recentHistory = uc.history.slice(0, 6);
                            monthlyConsumption += recentHistory.reduce((sum, h) => sum + (parseFloat(h["Consumo(kWh)"]) || 0), 0) / recentHistory.length;
                            monthlyPaid += recentHistory.reduce((sum, h) => sum + (parseFloat(h["Valor"]) || 0), 0) / recentHistory.length;
                        }
                    });
                }
                
                let opportunityScore = 0;
                
                if (balance === 0) opportunityScore += 40;
                else if (balance < 50) opportunityScore += 30;
                else if (balance < 100) opportunityScore += 20;
                else if (balance < 200) opportunityScore += 10;
                
                if (monthlyConsumption > 0 && power > 0) {
                    const consumptionPerKwp = monthlyConsumption / power;
                    if (consumptionPerKwp > 150) opportunityScore += 30;
                    else if (consumptionPerKwp > 100) opportunityScore += 20;
                    else if (consumptionPerKwp > 50) opportunityScore += 10;
                }
                
                if (monthlyPaid > 200) opportunityScore += 20;
                else if (monthlyPaid > 100) opportunityScore += 15;
                else if (monthlyPaid > 50) opportunityScore += 10;
                
                if (hasHistory) {
                    opportunityScore += 5;
                }
                
                if (!hasHistory) {
                    opportunityScore = Math.max(0, opportunityScore - 20);
                }
                
                let category = 'low';
                if (opportunityScore >= 70) category = 'urgent';
                else if (opportunityScore >= 40) category = 'medium';
                
                return {
                    ...client,
                    opportunityScore: Math.round(opportunityScore),
                    monthlyConsumption: Math.round(monthlyConsumption),
                    monthlyPaid: Math.round(monthlyPaid),
                    category,
                    hasHistoryData: hasHistory,
                    balanceStatus: balance === 0 ? 'zero' : balance < 50 ? 'critical' : balance < 100 ? 'low' : 'ok'
                };
            })
            .filter(client => client !== null)
            .filter(client => {
                if (filterType === 'all') return client.opportunityScore > 0;
                return client.category === filterType;
            })
            .sort((a, b) => {
                let aValue, bValue;
                
                switch (sortBy) {
                    case 'name':
                        aValue = a.name?.toLowerCase() || '';
                        bValue = b.name?.toLowerCase() || '';
                        break;
                    case 'balance':
                        aValue = a.totalBalance || 0;
                        bValue = b.totalBalance || 0;
                        break;
                    case 'urgency':
                        aValue = a.opportunityScore || 0;
                        bValue = b.opportunityScore || 0;
                        break;
                    case 'consumption':
                        aValue = a.monthlyConsumption || 0;
                        bValue = b.monthlyConsumption || 0;
                        break;
                    case 'monthlyPaid':
                        aValue = a.monthlyPaid || 0;
                        bValue = b.monthlyPaid || 0;
                        break;
                    case 'category':
                        const categoryOrder = { 'urgent': 3, 'medium': 2, 'low': 1 };
                        aValue = categoryOrder[a.category] || 0;
                        bValue = categoryOrder[b.category] || 0;
                        break;
                    default:
                        aValue = a.opportunityScore || 0;
                        bValue = b.opportunityScore || 0;
                }
                
                let comparison = 0;
                if (typeof aValue === 'string') {
                    comparison = aValue.localeCompare(bValue);
                } else {
                    comparison = aValue - bValue;
                }
                
                return sortDirection === 'asc' ? comparison : -comparison;
            });
    }, [clients, sortBy, sortDirection, filterType]);

    const stats = useMemo(() => {
        const total = opportunities.length;
        const urgent = opportunities.filter(o => o.category === 'urgent').length;
        const medium = opportunities.filter(o => o.category === 'medium').length;
        const low = opportunities.filter(o => o.category === 'low').length;
        
        return {
            total,
            urgent,
            medium,
            low
        };
    }, [opportunities]);

    return (
        <div className="space-y-6">
            {/* Header com Filtros */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Oportunidades de Negócio</h2>
                    <p className="text-gray-400">Clientes que precisam de mais energia solar</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todas as Oportunidades</option>
                        <option value="urgent">🚨 Urgentes</option>
                        <option value="medium">⚠️ Médias</option>
                        <option value="low">💡 Baixas</option>
                    </select>
                    
                    <div className="flex items-center px-3 py-2 bg-gray-800 rounded-lg border border-gray-600">
                        <span className="text-gray-400 text-sm mr-2">Ordenado por:</span>
                        <span className="text-white text-sm capitalize">
                            {sortBy === 'name' ? 'Nome' :
                             sortBy === 'balance' ? 'Saldo' :
                             sortBy === 'urgency' ? 'Urgência' :
                             sortBy === 'consumption' ? 'Consumo' :
                             sortBy === 'monthlyPaid' ? 'Valor Pago' :
                             sortBy === 'category' ? 'Categoria' : 'Urgência'}
                        </span>
                        <span className="ml-1">{getSortIcon(sortBy)}</span>
                    </div>
                </div>
            </div>

            {/* Estatísticas das Oportunidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <OpportunityStatCard
                    title="Total"
                    value={stats.total}
                    icon="🎯"
                    color="bg-blue-600"
                />
                <OpportunityStatCard
                    title="Urgentes"
                    value={stats.urgent}
                    icon="🚨"
                    color="bg-red-600"
                />
                <OpportunityStatCard
                    title="Médias"
                    value={stats.medium}
                    icon="⚠️"
                    color="bg-orange-600"
                />
                <OpportunityStatCard
                    title="Baixas"
                    value={stats.low}
                    icon="💡"
                    color="bg-green-600"
                />
            </div>

            {/* Lista de Oportunidades */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
                <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">
                            Lista de Oportunidades ({opportunities.length})
                        </h3>
                        <div className="text-sm text-gray-400">
                            💡 Clique nas colunas para ordenar • Clique no cliente para ver detalhes
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors select-none"
                                    onClick={() => handleSort('name')}
                                    title="Clique para ordenar por nome"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Cliente</span>
                                        <span className="text-sm">{getSortIcon('name')}</span>
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors select-none"
                                    onClick={() => handleSort('urgency')}
                                    title="Clique para ordenar por score de urgência"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Score</span>
                                        <span className="text-sm">{getSortIcon('urgency')}</span>
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors select-none"
                                    onClick={() => handleSort('balance')}
                                    title="Clique para ordenar por saldo atual"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Saldo Atual</span>
                                        <span className="text-sm">{getSortIcon('balance')}</span>
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors select-none"
                                    onClick={() => handleSort('consumption')}
                                    title="Clique para ordenar por consumo mensal"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Consumo/Mês</span>
                                        <span className="text-sm">{getSortIcon('consumption')}</span>
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors select-none"
                                    onClick={() => handleSort('monthlyPaid')}
                                    title="Clique para ordenar por valor pago mensalmente"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Valor Pago/Mês</span>
                                        <span className="text-sm">{getSortIcon('monthlyPaid')}</span>
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors select-none"
                                    onClick={() => handleSort('category')}
                                    title="Clique para ordenar por categoria"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>Categoria</span>
                                        <span className="text-sm">{getSortIcon('category')}</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {opportunities.map((opportunity, index) => (
                                <OpportunityRow 
                                    key={opportunity.id} 
                                    opportunity={opportunity} 
                                    index={index}
                                    onClick={() => handleClientClick(opportunity)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {opportunities.length === 0 && (
                    <div className="p-8 text-center">
                        <div className="text-gray-400 text-lg mb-2">🎉</div>
                        <p className="text-gray-400">Nenhuma oportunidade encontrada com os filtros atuais</p>
                    </div>
                )}
            </div>

            {/* Insights Automáticos */}
            <OpportunityInsights opportunities={opportunities} stats={stats} />

            {/* Modal do Cliente - Usando componente separado */}
            <ClientModal 
                client={selectedClient}
                isOpen={isModalOpen}
                onClose={() => {
                    console.log('Fechando modal...');
                    setIsModalOpen(false);
                    setSelectedClient(null);
                }}
            />
        </div>
    );
};

// Componente Stat Card para Oportunidades
const OpportunityStatCard = ({ title, value, icon, color }) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-xs font-medium uppercase">{title}</p>
                <p className="text-lg font-bold text-white mt-1">{value}</p>
            </div>
            <div className={`${color} p-2 rounded-lg`}>
                <span className="text-lg">{icon}</span>
            </div>
        </div>
    </div>
);

// Componente Row da Oportunidade
const OpportunityRow = ({ opportunity, index, onClick }) => {
    const getCategoryColor = (category) => {
        switch (category) {
            case 'urgent': return 'bg-red-900/30 text-red-300';
            case 'medium': return 'bg-orange-900/30 text-orange-300';
            case 'low': return 'bg-blue-900/30 text-blue-300';
            default: return 'bg-gray-700 text-gray-300';
        }
    };

    const getCategoryLabel = (category) => {
        switch (category) {
            case 'urgent': return '🚨 Urgente';
            case 'medium': return '⚠️ Média';
            case 'low': return '💡 Baixa';
            default: return 'N/A';
        }
    };

    const getBalanceColor = (balanceStatus) => {
        switch (balanceStatus) {
            case 'zero': return 'text-red-400';
            case 'critical': return 'text-orange-400';
            case 'low': return 'text-yellow-400';
            default: return 'text-gray-300';
        }
    };

    return (
        <tr 
            className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'} hover:bg-gray-700 transition-all duration-200 cursor-pointer transform hover:scale-[1.01]`}
            onClick={onClick}
        >
            <td className="px-6 py-4">
                <div>
                    <p className="text-white font-medium">
                        {opportunity.clientNumber && `${opportunity.clientNumber} - `}{opportunity.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                        {opportunity.power}kWp • {opportunity.address || 'Endereço não informado'}
                    </p>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center">
                    <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                        <div 
                            className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full"
                            style={{ width: `${opportunity.opportunityScore}%` }}
                        ></div>
                    </div>
                    <span className="text-white font-medium">{opportunity.opportunityScore}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`font-medium ${getBalanceColor(opportunity.balanceStatus)}`}>
                    {(opportunity.totalBalance || 0).toFixed(0)} kWh
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-gray-300">
                    {opportunity.hasHistoryData ? `${opportunity.monthlyConsumption} kWh` : 'Sem dados'}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-gray-300">
                    {opportunity.hasHistoryData ? `R$ ${opportunity.monthlyPaid.toLocaleString('pt-BR')}` : 'Sem dados'}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(opportunity.category)}`}>
                    {getCategoryLabel(opportunity.category)}
                </span>
            </td>
        </tr>
    );
};

// Componente Insights
const OpportunityInsights = ({ opportunities, stats }) => {
    const insights = useMemo(() => {
        const insights = [];
        
        if (stats.urgent > 0) {
            insights.push({
                type: 'urgent',
                title: 'Ação Imediata Necessária',
                message: `${stats.urgent} clientes com saldo zero ou crítico precisam de atenção urgente`,
                action: 'Priorizar contato comercial'
            });
        }
        
        const noHistoryClients = opportunities.filter(o => !o.hasHistoryData).length;
        if (noHistoryClients > 0) {
            insights.push({
                type: 'warning',
                title: 'Dados Incompletos',
                message: `${noHistoryClients} clientes sem histórico de consumo`,
                action: 'Solicitar faturas para análise precisa'
            });
        }
        
        if (stats.total > 20) {
            insights.push({
                type: 'opportunity',
                title: 'Grande Carteira de Oportunidades',
                message: `${stats.total} oportunidades identificadas na carteira`,
                action: 'Segmentar por prioridade para abordagem comercial'
            });
        }
        
        return insights;
    }, [opportunities, stats]);

    if (insights.length === 0) return null;

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🧠</span>
                Insights Automáticos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} />
                ))}
            </div>
        </div>
    );
};

// Componente Insight Card
const InsightCard = ({ insight }) => {
    const getInsightColor = (type) => {
        switch (type) {
            case 'urgent': return 'border-red-500 bg-red-900/20';
            case 'opportunity': return 'border-green-500 bg-green-900/20';
            case 'warning': return 'border-orange-500 bg-orange-900/20';
            default: return 'border-blue-500 bg-blue-900/20';
        }
    };

    return (
        <div className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
            <h4 className="text-white font-semibold text-sm mb-2">{insight.title}</h4>
            <p className="text-gray-300 text-sm mb-3">{insight.message}</p>
            <p className="text-gray-400 text-xs italic">{insight.action}</p>
        </div>
    );
};

window.OpportunitiesDashboard = OpportunitiesDashboard;