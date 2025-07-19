const { useMemo, useState } = React;

const TrendsDashboard = ({ clients, consumerUnits }) => {
    const [timeRange, setTimeRange] = useState('6months'); // 3months, 6months, 1year, all
    const [trendType, setTrendType] = useState('consumption'); // consumption, balance, clients

    // Processar dados históricos para trends
    const trendsData = useMemo(() => {
        const monthlyData = {};
        const clientGrowth = {};
        
        // Processar histórico de consumo das UCs
        consumerUnits.forEach(uc => {
            if (uc.history && uc.history.length > 0) {
                uc.history.forEach(entry => {
                    const monthYear = entry["Referência"];
                    if (monthYear && typeof monthYear === 'string') {
                        if (!monthlyData[monthYear]) {
                            monthlyData[monthYear] = {
                                consumption: 0,
                                value: 0,
                                clients: new Set(),
                                savings: 0
                            };
                        }
                        
                        const consumption = parseFloat(entry["Consumo(kWh)"]) || 0;
                        const value = parseFloat(entry["Valor"]) || 0;
                        const estimatedCost = consumption * 0.99; // R$ 0,99 por kWh estimado
                        
                        monthlyData[monthYear].consumption += consumption;
                        monthlyData[monthYear].value += value;
                        monthlyData[monthYear].savings += Math.max(0, estimatedCost - value);
                        monthlyData[monthYear].clients.add(uc.clientId);
                    }
                });
            }
        });

        // Processar crescimento da carteira por data de instalação
        clients.forEach(client => {
            if (client.installDate && client.installDate !== 'N/A') {
                const [day, month, year] = client.installDate.split('/');
                if (day && month && year) {
                    const monthYear = `${month}/${year}`;
                    if (!clientGrowth[monthYear]) {
                        clientGrowth[monthYear] = 0;
                    }
                    clientGrowth[monthYear]++;
                }
            }
        });

        // Converter para arrays e ordenar
        const consumptionTrends = Object.entries(monthlyData)
            .map(([monthYear, data]) => ({
                monthYear,
                consumption: data.consumption,
                value: data.value,
                savings: data.savings,
                clientsCount: data.clients.size,
                averageConsumption: data.clients.size > 0 ? data.consumption / data.clients.size : 0
            }))
            .sort((a, b) => {
                const [m1, y1] = a.monthYear.split('/');
                const [m2, y2] = b.monthYear.split('/');
                return new Date(y1, m1 - 1) - new Date(y2, m2 - 1);
            });

        const growthTrends = Object.entries(clientGrowth)
            .map(([monthYear, count]) => ({ monthYear, newClients: count }))
            .sort((a, b) => {
                const [m1, y1] = a.monthYear.split('/');
                const [m2, y2] = b.monthYear.split('/');
                return new Date(y1, m1 - 1) - new Date(y2, m2 - 1);
            });

        // Calcular tendências e insights
        const recentMonths = consumptionTrends.slice(-6);
        const avgRecentConsumption = recentMonths.reduce((sum, m) => sum + m.consumption, 0) / Math.max(recentMonths.length, 1);
        const avgRecentSavings = recentMonths.reduce((sum, m) => sum + m.savings, 0) / Math.max(recentMonths.length, 1);
        
        return {
            consumptionTrends,
            growthTrends,
            avgRecentConsumption,
            avgRecentSavings,
            totalSavings: consumptionTrends.reduce((sum, m) => sum + m.savings, 0),
            totalConsumption: consumptionTrends.reduce((sum, m) => sum + m.consumption, 0)
        };
    }, [clients, consumerUnits]);

    // Análise de padrões sazonais
    const seasonalAnalysis = useMemo(() => {
        const monthlyAverages = {};
        
        trendsData.consumptionTrends.forEach(trend => {
            const [month] = trend.monthYear.split('/');
            const monthName = new Date(2024, parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long' });
            
            if (!monthlyAverages[monthName]) {
                monthlyAverages[monthName] = { consumption: 0, count: 0, savings: 0 };
            }
            
            monthlyAverages[monthName].consumption += trend.consumption;
            monthlyAverages[monthName].savings += trend.savings;
            monthlyAverages[monthName].count++;
        });

        const seasonalData = Object.entries(monthlyAverages)
            .map(([month, data]) => ({
                month,
                avgConsumption: data.count > 0 ? data.consumption / data.count : 0,
                avgSavings: data.count > 0 ? data.savings / data.count : 0
            }))
            .sort((a, b) => {
                const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                               'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                return months.indexOf(a.month) - months.indexOf(b.month);
            });

        return seasonalData;
    }, [trendsData]);

    // Previsões simples baseadas em tendência linear
    const predictions = useMemo(() => {
        const recentData = trendsData.consumptionTrends.slice(-6);
        if (recentData.length < 2) return null;

        const consumptionTrend = recentData.map((d, i) => ({ x: i, y: d.consumption }));
        const savingsTrend = recentData.map((d, i) => ({ x: i, y: d.savings }));
        
        // Cálculo de regressão linear simples
        const linearRegression = (data) => {
            const n = data.length;
            const sumX = data.reduce((sum, d) => sum + d.x, 0);
            const sumY = data.reduce((sum, d) => sum + d.y, 0);
            const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
            const sumXX = data.reduce((sum, d) => sum + d.x * d.x, 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            
            return { slope, intercept };
        };

        const consumptionRegression = linearRegression(consumptionTrend);
        const savingsRegression = linearRegression(savingsTrend);
        
        // Previsão para os próximos 3 meses
        const nextMonths = [6, 7, 8].map(x => ({
            consumption: Math.max(0, consumptionRegression.slope * x + consumptionRegression.intercept),
            savings: Math.max(0, savingsRegression.slope * x + savingsRegression.intercept)
        }));

        return {
            nextMonths,
            consumptionTrend: consumptionRegression.slope > 0 ? 'increasing' : 'decreasing',
            savingsTrend: savingsRegression.slope > 0 ? 'increasing' : 'decreasing'
        };
    }, [trendsData]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Análise de Tendências</h2>
                    <p className="text-gray-400">Padrões de consumo e oportunidades futuras</p>
                </div>
                
                <div className="flex gap-4">
                    <select 
                        value={trendType} 
                        onChange={(e) => setTrendType(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg"
                    >
                        <option value="consumption">Consumo & Economia</option>
                        <option value="balance">Saldos & Performance</option>
                        <option value="clients">Crescimento da Carteira</option>
                    </select>
                    
                    <select 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg"
                    >
                        <option value="3months">Últimos 3 Meses</option>
                        <option value="6months">Últimos 6 Meses</option>
                        <option value="1year">Último Ano</option>
                        <option value="all">Todo o Período</option>
                    </select>
                </div>
            </div>

            {/* Resumo das Tendências */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <TrendStatCard
                    title="Economia Total"
                    value={`R$ ${trendsData.totalSavings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                    trend={predictions?.savingsTrend || 'stable'}
                    icon="💰"
                    color="bg-green-600"
                />
                <TrendStatCard
                    title="Consumo Total"
                    value={`${(trendsData.totalConsumption / 1000).toFixed(1)}k kWh`}
                    trend={predictions?.consumptionTrend || 'stable'}
                    icon="⚡"
                    color="bg-blue-600"
                />
                <TrendStatCard
                    title="Economia Mensal"
                    value={`R$ ${trendsData.avgRecentSavings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                    subtitle="Média recente"
                    icon="📈"
                    color="bg-orange-600"
                />
                <TrendStatCard
                    title="Novos Clientes"
                    value={trendsData.growthTrends.slice(-3).reduce((sum, m) => sum + m.newClients, 0)}
                    subtitle="Últimos 3 meses"
                    icon="👥"
                    color="bg-purple-600"
                />
            </div>

            {/* Gráficos Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trendType === 'consumption' && (
                    <>
                        <TrendChartCard title="Evolução do Consumo">
                            <ConsumptionTrendChart data={trendsData.consumptionTrends} timeRange={timeRange} />
                        </TrendChartCard>
                        
                        <TrendChartCard title="Evolução da Economia">
                            <SavingsTrendChart data={trendsData.consumptionTrends} timeRange={timeRange} />
                        </TrendChartCard>
                    </>
                )}
                
                {trendType === 'balance' && (
                    <>
                        <TrendChartCard title="Análise Sazonal">
                            <SeasonalChart data={seasonalAnalysis} />
                        </TrendChartCard>
                        
                        <TrendChartCard title="Performance por Cliente">
                            <ClientPerformanceChart clients={clients} />
                        </TrendChartCard>
                    </>
                )}
                
                {trendType === 'clients' && (
                    <>
                        <TrendChartCard title="Crescimento da Carteira">
                            <ClientGrowthChart data={trendsData.growthTrends} />
                        </TrendChartCard>
                        
                        <TrendChartCard title="Distribuição por Status">
                            <StatusEvolutionChart clients={clients} />
                        </TrendChartCard>
                    </>
                )}
            </div>

            {/* Previsões e Insights */}
            {predictions && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PredictionsCard predictions={predictions} />
                    <InsightsCard trends={trendsData} seasonal={seasonalAnalysis} />
                </div>
            )}
        </div>
    );
};

// Componente Trend Stat Card
const TrendStatCard = ({ title, value, subtitle, trend, icon, color }) => {
    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'increasing': return '📈';
            case 'decreasing': return '📉';
            default: return '➡️';
        }
    };

    const getTrendColor = (trend) => {
        switch (trend) {
            case 'increasing': return 'text-green-400';
            case 'decreasing': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                    {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
                    {trend && (
                        <div className={`flex items-center mt-2 ${getTrendColor(trend)}`}>
                            <span className="mr-1">{getTrendIcon(trend)}</span>
                            <span className="text-xs capitalize">{trend === 'increasing' ? 'crescendo' : trend === 'decreasing' ? 'diminuindo' : 'estável'}</span>
                        </div>
                    )}
                </div>
                <div className={`${color} p-3 rounded-lg`}>
                    <span className="text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );
};

// Componente Trend Chart Card
const TrendChartCard = ({ title, children }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-64">
            {children}
        </div>
    </div>
);

// Gráfico de Consumo (placeholder simples)
const ConsumptionTrendChart = ({ data, timeRange }) => {
    const filteredData = useMemo(() => {
        const months = {
            '3months': 3,
            '6months': 6,
            '1year': 12,
            'all': data.length
        };
        return data.slice(-months[timeRange]);
    }, [data, timeRange]);

    return (
        <div className="h-full flex items-end space-x-1 px-4">
            {filteredData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                        className="w-full bg-blue-500 rounded-t-sm"
                        style={{ 
                            height: `${Math.max(10, (item.consumption / Math.max(...filteredData.map(d => d.consumption))) * 200)}px` 
                        }}
                    ></div>
                    <span className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left">
                        {item.monthYear}
                    </span>
                </div>
            ))}
        </div>
    );
};

// Outros gráficos (placeholders simples)
const SavingsTrendChart = ({ data, timeRange }) => (
    <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">Gráfico de Economia em Desenvolvimento</p>
    </div>
);

const SeasonalChart = ({ data }) => (
    <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">Análise Sazonal em Desenvolvimento</p>
    </div>
);

const ClientPerformanceChart = ({ clients }) => (
    <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">Performance por Cliente em Desenvolvimento</p>
    </div>
);

const ClientGrowthChart = ({ data }) => (
    <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">Crescimento da Carteira em Desenvolvimento</p>
    </div>
);

const StatusEvolutionChart = ({ clients }) => (
    <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">Evolução de Status em Desenvolvimento</p>
    </div>
);

// Componente Predictions Card
const PredictionsCard = ({ predictions }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🔮</span>
            Previsões (Próximos 3 Meses)
        </h3>
        <div className="space-y-4">
            <div className="p-4 bg-gray-700/50 rounded-lg">
                <h4 className="text-white font-medium mb-2">Consumo Esperado</h4>
                <div className="space-y-2">
                    {predictions.nextMonths.map((month, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-400">Mês {index + 1}</span>
                            <span className="text-white font-medium">
                                {month.consumption.toFixed(0)} kWh
                            </span>
                        </div>
                    ))}
                </div>
                <div className={`mt-2 flex items-center text-sm ${
                    predictions.consumptionTrend === 'increasing' ? 'text-orange-400' : 'text-green-400'
                }`}>
                    <span className="mr-1">
                        {predictions.consumptionTrend === 'increasing' ? '📈' : '📉'}
                    </span>
                    Tendência: {predictions.consumptionTrend === 'increasing' ? 'Crescimento' : 'Redução'}
                </div>
            </div>
            
            <div className="p-4 bg-gray-700/50 rounded-lg">
                <h4 className="text-white font-medium mb-2">Economia Esperada</h4>
                <div className="space-y-2">
                    {predictions.nextMonths.map((month, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-400">Mês {index + 1}</span>
                            <span className="text-white font-medium">
                                R$ {month.savings.toFixed(0)}
                            </span>
                        </div>
                    ))}
                </div>
                <div className={`mt-2 flex items-center text-sm ${
                    predictions.savingsTrend === 'increasing' ? 'text-green-400' : 'text-orange-400'
                }`}>
                    <span className="mr-1">
                        {predictions.savingsTrend === 'increasing' ? '📈' : '📉'}
                    </span>
                    Tendência: {predictions.savingsTrend === 'increasing' ? 'Crescimento' : 'Redução'}
                </div>
            </div>
        </div>
    </div>
);

// Componente Insights Card
const InsightsCard = ({ trends, seasonal }) => {
    const insights = useMemo(() => {
        const insights = [];
        
        // Insight sobre sazonalidade
        if (seasonal.length > 0) {
            const bestMonth = seasonal.reduce((max, month) => 
                month.avgSavings > max.avgSavings ? month : max
            );
            const worstMonth = seasonal.reduce((min, month) => 
                month.avgSavings < min.avgSavings ? month : min
            );
            
            insights.push({
                icon: '🌱',
                title: 'Melhor Período',
                text: `${bestMonth.month} é o mês com maior economia média`,
                type: 'positive'
            });
            
            insights.push({
                icon: '⚠️',
                title: 'Período de Atenção',
                text: `${worstMonth.month} apresenta menor economia média`,
                type: 'warning'
            });
        }
        
        // Insight sobre crescimento
        const recentGrowth = trends.growthTrends.slice(-3).reduce((sum, m) => sum + m.newClients, 0);
        if (recentGrowth > 0) {
            insights.push({
                icon: '📊',
                title: 'Crescimento',
                text: `${recentGrowth} novos clientes nos últimos 3 meses`,
                type: 'positive'
            });
        }
        
        // Insight sobre economia
        if (trends.avgRecentSavings > 1000) {
            insights.push({
                icon: '💰',
                title: 'Alta Performance',
                text: `Economia média mensal acima de R$ 1.000`,
                type: 'positive'
            });
        }
        
        return insights;
    }, [trends, seasonal]);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">💡</span>
                Insights Automáticos
            </h3>
            <div className="space-y-3">
                {insights.length > 0 ? insights.map((insight, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                        insight.type === 'positive' ? 'border-green-600/30 bg-green-900/20' :
                        insight.type === 'warning' ? 'border-orange-600/30 bg-orange-900/20' :
                        'border-blue-600/30 bg-blue-900/20'
                    }`}>
                        <div className="flex items-start space-x-3">
                            <span className="text-lg">{insight.icon}</span>
                            <div>
                                <h4 className="text-white font-medium text-sm">{insight.title}</h4>
                                <p className="text-gray-300 text-sm mt-1">{insight.text}</p>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8">
                        <p className="text-gray-400">Coletando dados para gerar insights...</p>
                        <p className="text-gray-500 text-sm mt-1">
                            Mais dados de histórico são necessários para análises detalhadas
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

window.TrendsDashboard = TrendsDashboard;