const { useMemo, useState } = React;

const RegionalDashboard = ({ clients }) => {
    const [selectedCity, setSelectedCity] = useState('all');

    // Análise regional dos dados
    const regionalData = useMemo(() => {
        const cityStats = {};
        
        clients.forEach(client => {
            // Extrair cidade do endereço
            let city = 'Cidade não informada';
            if (client.address && client.address !== 'N/A') {
                const parts = client.address.split(',');
                if (parts.length > 1) {
                    city = parts[parts.length - 1].trim();
                } else {
                    city = client.address.trim();
                }
            }
            
            if (!cityStats[city]) {
                cityStats[city] = {
                    name: city,
                    totalClients: 0,
                    totalPower: 0,
                    totalBalance: 0,
                    averageBalance: 0,
                    statusDistribution: {},
                    opportunities: 0,
                    clients: []
                };
            }
            
            const stats = cityStats[city];
            stats.totalClients++;
            stats.totalPower += parseFloat(String(client.power || '0').replace(',', '.')) || 0;
            stats.totalBalance += client.totalBalance || 0;
            stats.clients.push(client);
            
            // Distribuição de status
            const status = client.status || 'unknown';
            stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1;
            
            // Contar oportunidades (saldo baixo)
            if ((client.totalBalance || 0) < 100) {
                stats.opportunities++;
            }
        });

        // FILTRO: Apenas cidades com pelo menos 2 clientes para métricas confiáveis
        const validCities = Object.values(cityStats)
            .filter(city => city.totalClients >= 2) // NOVO: Filtro mínimo
            .map(city => ({
                ...city,
                averageBalance: city.totalClients > 0 ? city.totalBalance / city.totalClients : 0,
                averagePower: city.totalClients > 0 ? city.totalPower / city.totalClients : 0,
                opportunityRate: city.totalClients > 0 ? (city.opportunities / city.totalClients) * 100 : 0,
                reliabilityScore: Math.min(100, (city.totalClients / 10) * 100) // Score de confiabilidade baseado no número de clientes
            }))
            .sort((a, b) => b.totalClients - a.totalClients);

        // Cidades com apenas 1 cliente (para mostrar separadamente)
        const singleClientCities = Object.values(cityStats)
            .filter(city => city.totalClients === 1)
            .map(city => ({
                ...city,
                averageBalance: city.totalBalance,
                averagePower: city.totalPower,
                opportunityRate: city.opportunities > 0 ? 100 : 0
            }))
            .sort((a, b) => b.totalBalance - a.totalBalance);

        // Encontrar melhor performance com critério mais inteligente
        const getBestPerformance = () => {
            if (validCities.length === 0) return { name: 'N/A', reason: 'Dados insuficientes' };
            
            // Critério: Maior saldo médio + pelo menos 3 clientes + baixa taxa de oportunidades
            const eligibleCities = validCities.filter(city => 
                city.totalClients >= 3 && city.opportunityRate < 50
            );
            
            if (eligibleCities.length === 0) {
                // Fallback: cidade com mais clientes entre as válidas
                const fallback = validCities[0];
                return { 
                    name: fallback.name, 
                    reason: `${fallback.totalClients} clientes`
                };
            }
            
            const best = eligibleCities.sort((a, b) => b.averageBalance - a.averageBalance)[0];
            return { 
                name: best.name, 
                reason: `${best.averageBalance.toFixed(0)} kWh médio`
            };
        };

        const bestPerformance = getBestPerformance();

        return {
            validCities, // Cidades com 2+ clientes
            singleClientCities, // Cidades com 1 cliente
            totalCities: validCities.length + singleClientCities.length,
            reliableCities: validCities.length,
            topCityByClients: validCities[0]?.name || 'N/A',
            topCityByPower: validCities.sort((a, b) => b.totalPower - a.totalPower)[0]?.name || 'N/A',
            bestPerformance
        };
    }, [clients]);

    // Dados da cidade selecionada
    const selectedCityData = useMemo(() => {
        if (selectedCity === 'all') return null;
        
        // Procurar nas cidades válidas primeiro
        let cityData = regionalData.validCities.find(city => city.name === selectedCity);
        
        // Se não encontrar, procurar nas cidades com 1 cliente
        if (!cityData) {
            cityData = regionalData.singleClientCities.find(city => city.name === selectedCity);
        }
        
        return cityData;
    }, [selectedCity, regionalData.validCities, regionalData.singleClientCities]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Análise Regional</h2>
                    <p className="text-gray-400">Distribuição e performance por cidade</p>
                </div>
                
                <div className="flex gap-4">
                    <select 
                        value={selectedCity} 
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Visão Geral</option>
                        <optgroup label="Cidades Confiáveis (2+ clientes)">
                            {regionalData.validCities.map(city => (
                                <option key={city.name} value={city.name}>
                                    {city.name} ({city.totalClients} clientes) ⭐
                                </option>
                            ))}
                        </optgroup>
                        {regionalData.singleClientCities.length > 0 && (
                            <optgroup label="Cidades com 1 cliente (dados limitados)">
                                {regionalData.singleClientCities.map(city => (
                                    <option key={city.name} value={city.name}>
                                        {city.name} (1 cliente) ⚠️
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RegionalStatCard
                    title="Cidades Analisadas"
                    value={regionalData.reliableCities}
                    subtitle={`${regionalData.totalCities} total (${regionalData.singleClientCities.length} com 1 cliente)`}
                    icon="🏙️"
                    color="bg-blue-600"
                />
                <RegionalStatCard
                    title="Maior Carteira"
                    value={regionalData.topCityByClients}
                    subtitle={`${regionalData.validCities[0]?.totalClients || 0} clientes`}
                    icon="👑"
                    color="bg-green-600"
                />
                <RegionalStatCard
                    title="Maior Potência"
                    value={regionalData.topCityByPower}
                    subtitle={`${regionalData.validCities.sort((a, b) => b.totalPower - a.totalPower)[0]?.totalPower.toFixed(1) || 0} kWp`}
                    icon="⚡"
                    color="bg-orange-600"
                />
                <RegionalStatCard
                    title="Melhor Performance"
                    value={regionalData.bestPerformance.name}
                    subtitle={regionalData.bestPerformance.reason}
                    icon="🏆"
                    color="bg-purple-600"
                />
            </div>

            {selectedCity === 'all' ? (
                // Visão geral de todas as cidades
                <>
                    {/* Ranking das Cidades */}
                    <div className="bg-gray-800 rounded-lg border border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Ranking por Cidade</h3>
                                <div className="text-sm text-gray-400">
                                    Apenas cidades com 2+ clientes (dados confiáveis)
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Posição</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Cidade</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Clientes</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Potência Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Saldo Médio</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Oportunidades</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Taxa de Oportunidade</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Confiabilidade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {regionalData.validCities.map((city, index) => (
                                        <tr 
                                            key={city.name} 
                                            className="hover:bg-gray-700 cursor-pointer transition-colors"
                                            onClick={() => setSelectedCity(city.name)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {index < 3 && (
                                                        <span className="mr-2">
                                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                                        </span>
                                                    )}
                                                    <span className="text-white font-medium">{index + 1}º</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white font-medium">{city.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-300">{city.totalClients}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-300">{city.totalPower.toFixed(1)} kWp</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-300">{city.averageBalance.toFixed(0)} kWh</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-medium ${city.opportunities > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                                    {city.opportunities}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                                                        <div 
                                                            className={`h-full rounded-full ${
                                                                city.opportunityRate > 50 ? 'bg-red-500' :
                                                                city.opportunityRate > 25 ? 'bg-orange-500' :
                                                                'bg-green-500'
                                                            }`}
                                                            style={{ width: `${Math.min(city.opportunityRate, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-gray-300 text-sm">{city.opportunityRate.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                                                        <div 
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${city.reliabilityScore}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-blue-400 text-sm">{city.reliabilityScore.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Cidades com 1 cliente */}
                        {regionalData.singleClientCities.length > 0 && (
                            <div className="p-4 border-t border-gray-700 bg-gray-750">
                                <h4 className="text-white font-medium mb-3 flex items-center">
                                    <span className="mr-2">⚠️</span>
                                    Cidades com 1 cliente (dados insuficientes para ranking)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {regionalData.singleClientCities.map(city => (
                                        <div 
                                            key={city.name}
                                            className="p-3 bg-gray-600/30 rounded border border-gray-600 cursor-pointer hover:bg-gray-600/50"
                                            onClick={() => setSelectedCity(city.name)}
                                        >
                                            <p className="text-white font-medium">{city.name}</p>
                                            <p className="text-gray-400 text-sm">
                                                {city.totalPower.toFixed(1)} kWp • {city.totalBalance.toFixed(0)} kWh
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Gráficos Comparativos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RegionalChartCard title="Distribuição de Clientes (Cidades Confiáveis)">
                            <ClientDistributionChart cities={regionalData.validCities.slice(0, 10)} />
                        </RegionalChartCard>
                        
                        <RegionalChartCard title="Potência por Cidade (Cidades Confiáveis)">
                            <PowerDistributionChart cities={regionalData.validCities.slice(0, 10)} />
                        </RegionalChartCard>
                    </div>
                </>
            ) : (
                // Detalhes da cidade selecionada
                selectedCityData && (
                    <>
                        {/* Aviso para cidades com 1 cliente */}
                        {selectedCityData.totalClients === 1 && (
                            <div className="mb-6 p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg">
                                <div className="flex items-center text-orange-300">
                                    <span className="mr-2">⚠️</span>
                                    <span className="font-medium">
                                        Esta cidade possui apenas 1 cliente. As métricas podem não ser representativas.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Stats da Cidade Selecionada */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <RegionalStatCard
                                title="Total de Clientes"
                                value={selectedCityData.totalClients}
                                subtitle={selectedCityData.totalClients === 1 ? "Dados limitados" : "Amostra confiável"}
                                icon="👥"
                                color="bg-blue-600"
                            />
                            <RegionalStatCard
                                title="Potência Total"
                                value={`${selectedCityData.totalPower.toFixed(1)} kWp`}
                                subtitle={selectedCityData.totalClients > 1 ? `${selectedCityData.averagePower.toFixed(1)} kWp/cliente` : "Cliente único"}
                                icon="⚡"
                                color="bg-green-600"
                            />
                            <RegionalStatCard
                                title={selectedCityData.totalClients === 1 ? "Saldo do Cliente" : "Saldo Médio"}
                                value={`${selectedCityData.averageBalance.toFixed(0)} kWh`}
                                subtitle={selectedCityData.totalClients > 1 ? `Total: ${selectedCityData.totalBalance.toFixed(0)} kWh` : "Saldo individual"}
                                icon="📊"
                                color="bg-orange-600"
                            />
                            <RegionalStatCard
                                title="Oportunidades"
                                value={selectedCityData.opportunities}
                                subtitle={`${selectedCityData.opportunityRate.toFixed(1)}% ${selectedCityData.totalClients === 1 ? '(cliente único)' : 'da cidade'}`}
                                icon="🎯"
                                color="bg-red-600"
                            />
                        </div>

                        {/* Status Distribution para a cidade */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <RegionalChartCard title={`Status em ${selectedCityData.name}`}>
                                <CityStatusChart statusData={selectedCityData.statusDistribution} />
                            </RegionalChartCard>
                            
                            <RegionalChartCard title={`Clientes de ${selectedCityData.name}`}>
                                <CityClientsList 
                                    clients={selectedCityData.clients} 
                                    showReliabilityWarning={selectedCityData.totalClients === 1}
                                />
                            </RegionalChartCard>
                        </div>

                        {/* Insights específicos da cidade */}
                        {selectedCityData.totalClients > 1 && (
                            <div className="mt-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <span className="mr-2">💡</span>
                                    Insights para {selectedCityData.name}
                                </h3>
                                <CityInsights city={selectedCityData} />
                            </div>
                        )}
                    </>
                )
            )}
        </div>
    );
};

// Componente Stat Card Regional
const RegionalStatCard = ({ title, value, subtitle, icon, color }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
                {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
            </div>
            <div className={`${color} p-3 rounded-lg`}>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    </div>
);

// Componente Chart Card Regional
const RegionalChartCard = ({ title, children }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-64">
            {children}
        </div>
    </div>
);

// Componente Client Distribution Chart
const ClientDistributionChart = ({ cities }) => (
    <div className="space-y-3 h-full overflow-y-auto">
        {cities.map((city, index) => (
            <div key={city.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                    <span className="text-gray-300 truncate">{city.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(city.totalClients / cities[0].totalClients) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-white font-medium w-8 text-right">{city.totalClients}</span>
                </div>
            </div>
        ))}
    </div>
);

// Componente Power Distribution Chart
const PowerDistributionChart = ({ cities }) => (
    <div className="space-y-3 h-full overflow-y-auto">
        {cities.map((city, index) => (
            <div key={city.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                    <span className="text-gray-300 truncate">{city.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(city.totalPower / cities[0].totalPower) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-white font-medium text-right">{city.totalPower.toFixed(1)}kW</span>
                </div>
            </div>
        ))}
    </div>
);

// Componente City Status Chart
const CityStatusChart = ({ statusData }) => {
    const statusLabels = {
        active: 'Em Garantia',
        expired: 'Expirada',
        monitoring: 'Monitoramento',
        recurring_maintenance: 'Manutenção',
        om_complete: 'O&M Completo'
    };

    const statusColors = {
        active: 'bg-green-500',
        expired: 'bg-red-500',
        monitoring: 'bg-blue-500',
        recurring_maintenance: 'bg-purple-500',
        om_complete: 'bg-orange-500'
    };

    const total = Object.values(statusData).reduce((sum, count) => sum + count, 0);

    return (
        <div className="space-y-3 h-full overflow-y-auto">
            {Object.entries(statusData).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                    <span className="text-gray-300">{statusLabels[status] || status}</span>
                    <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${statusColors[status] || 'bg-gray-500'}`}
                                style={{ width: `${(count / total) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-white font-medium w-8 text-right">{count}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Componente City Clients List
const CityClientsList = ({ clients, showReliabilityWarning = false }) => (
    <div className="space-y-2 h-full overflow-y-auto">
        {showReliabilityWarning && (
            <div className="p-3 bg-orange-900/20 border border-orange-600/30 rounded-lg mb-3">
                <p className="text-orange-300 text-sm">
                    ⚠️ Dados de apenas 1 cliente - métricas não representativas
                </p>
            </div>
        )}
        
        {clients.map(client => (
            <div key={client.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                <div>
                    <p className="text-white text-sm font-medium">
                        {client.clientNumber && `${client.clientNumber} - `}{client.name}
                    </p>
                    <p className="text-gray-400 text-xs">{client.power}kWp</p>
                </div>
                <div className="text-right">
                    <p className="text-white text-sm">{(client.totalBalance || 0).toFixed(0)} kWh</p>
                    <div className={`text-xs px-2 py-1 rounded ${
                        (client.totalBalance || 0) === 0 ? 'bg-red-900/30 text-red-300' :
                        (client.totalBalance || 0) < 50 ? 'bg-orange-900/30 text-orange-300' :
                        'bg-green-900/30 text-green-300'
                    }`}>
                        {(client.totalBalance || 0) === 0 ? 'Zero' :
                         (client.totalBalance || 0) < 50 ? 'Baixo' : 'OK'}
                    </div>
                </div>
            </div>
        ))}
        {clients.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum cliente encontrado</p>
        )}
    </div>
);

// Componente City Insights
const CityInsights = ({ city }) => {
    const insights = useMemo(() => {
        const insights = [];
        
        // Insight sobre tamanho da amostra
        if (city.totalClients >= 5) {
            insights.push({
                icon: '✅',
                text: `Amostra confiável com ${city.totalClients} clientes`,
                type: 'positive'
            });
        } else if (city.totalClients >= 2) {
            insights.push({
                icon: '⚠️',
                text: `Amostra pequena (${city.totalClients} clientes) - métricas limitadas`,
                type: 'warning'
            });
        }
        
                // Insight sobre performance
                if (city.opportunityRate === 0) {
                    insights.push({
                        icon: '🎉',
                        text: 'Excelente performance - nenhuma oportunidade de expansão identificada',
                        type: 'positive'
                    });
                }
        
                // Insight sobre oportunidades
                if (city.opportunityRate > 50) {
                    insights.push({
                        icon: '🚩',
                        text: 'Alta taxa de oportunidades - muitos clientes com saldo baixo',
                        type: 'negative'
                    });
                } else if (city.opportunityRate > 0) {
                    insights.push({
                        icon: '🔎',
                        text: `Existem ${city.opportunities} oportunidades de expansão identificadas`,
                        type: 'warning'
                    });
                }
        
                // Insight sobre potência
                if (city.averagePower > 10) {
                    insights.push({
                        icon: '⚡',
                        text: `Potência média elevada (${city.averagePower.toFixed(1)} kWp/cliente)`,
                        type: 'positive'
                    });
                }
        
                return insights;
            }, [city]);
        
            return (
                <div className="space-y-3">
                    {insights.length === 0 ? (
                        <p className="text-gray-400">Nenhum insight relevante para esta cidade.</p>
                    ) : (
                        insights.map((insight, idx) => (
                            <div key={idx} className={`flex items-center space-x-2 p-3 rounded-lg ${
                                insight.type === 'positive' ? 'bg-green-900/20 border border-green-600/30 text-green-300' :
                                insight.type === 'warning' ? 'bg-orange-900/20 border border-orange-600/30 text-orange-300' :
                                'bg-red-900/20 border border-red-600/30 text-red-300'
                            }`}>
                                <span className="text-xl">{insight.icon}</span>
                                <span>{insight.text}</span>
                            </div>
                        ))
                    )}
                </div>
            );
        };
        
        // Disponibilizar globalmente para uso no App
        window.RegionalDashboard = RegionalDashboard;