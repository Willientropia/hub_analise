const { useMemo } = React;

const OverviewDashboard = ({ clients, consumerUnits }) => {
    // Calcular KPIs principais
    const kpis = useMemo(() => {
        const totalClients = clients.length;
        const totalPowerInstalled = clients.reduce((sum, client) => {
            const power = parseFloat(String(client.power || '0').replace(',', '.')) || 0;
            return sum + power;
        }, 0);
        
        // Clientes por status
        const statusDistribution = clients.reduce((acc, client) => {
            acc[client.status] = (acc[client.status] || 0) + 1;
            return acc;
        }, {});
        
        // Análise de saldo
        const lowBalanceClients = clients.filter(client => 
            (client.totalBalance || 0) < 100
        ).length;
        
        const zeroBalanceClients = clients.filter(client => 
            (client.totalBalance || 0) === 0
        ).length;
        
        // Clientes pagando conta (sem saldo ou saldo baixo)
        const payingBillClients = clients.filter(client => 
            (client.totalBalance || 0) < 50
        ).length;
        
        // Clientes com histórico vs sem histórico
        const clientsWithHistory = clients.filter(client => client.hasHistoryData).length;
        const clientsWithoutHistory = clients.filter(client => !client.hasHistoryData).length;
        
        // Média de saldo (apenas clientes com dados)
        const validConsumerUnits = consumerUnits.filter(uc => 
            uc.history && uc.history.length > 0
        );
        const averageBalance = validConsumerUnits.length > 0 
            ? validConsumerUnits.reduce((sum, uc) => sum + (parseFloat(uc.balanceKWH) || 0), 0) / validConsumerUnits.length
            : 0;
            
        return {
            totalClients,
            totalPowerInstalled: totalPowerInstalled.toFixed(2),
            statusDistribution,
            lowBalanceClients,
            zeroBalanceClients,
            payingBillClients,
            clientsWithHistory,
            clientsWithoutHistory,
            averageBalance: averageBalance.toFixed(2),
            opportunityRate: totalClients > 0 ? ((lowBalanceClients / totalClients) * 100).toFixed(1) : '0',
            historyRate: totalClients > 0 ? ((clientsWithHistory / totalClients) * 100).toFixed(1) : '0'
        };
    }, [clients, consumerUnits]);

    return (
        <div className="space-y-6">
            {/* KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <KPICard
                    title="Com Histórico"
                    value={kpis.clientsWithHistory}
                    subtitle={`${kpis.historyRate}% do total`}
                    icon="📊"
                    color="bg-blue-600"
                />
                <KPICard
                    title="Potência Total"
                    value={`${kpis.totalPowerInstalled} kWp`}
                    icon="⚡"
                    color="bg-green-600"
                />
                <KPICard
                    title="Oportunidades"
                    value={kpis.lowBalanceClients}
                    subtitle={`${kpis.opportunityRate}% da carteira`}
                    icon="🎯"
                    color="bg-orange-600"
                />
                <KPICard
                    title="Urgentes"
                    value={kpis.zeroBalanceClients}
                    subtitle="Saldo zero"
                    icon="🚨"
                    color="bg-red-600"
                />
                <KPICard
                    title="Sem Dados"
                    value={kpis.clientsWithoutHistory}
                    subtitle="Excluídos da análise"
                    icon="⚠️"
                    color="bg-gray-600"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <ChartCard title="Distribuição por Status">
                    <StatusDistributionChart data={kpis.statusDistribution} />
                </ChartCard>

                {/* Balance Distribution */}
                <ChartCard title="Distribuição de Saldos">
                    <BalanceDistributionChart clients={clients} />
                </ChartCard>
            </div>

            {/* Opportunities Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <OpportunityCard
                    title="Clientes Pagando Conta"
                    count={kpis.payingBillClients}
                    description="Saldo abaixo de 50 kWh"
                    priority="high"
                />
                <OpportunityCard
                    title="Saldo Médio Baixo"
                    count={kpis.lowBalanceClients - kpis.zeroBalanceClients}
                    description="Entre 0 e 100 kWh"
                    priority="medium"
                />
                <OpportunityCard
                    title="Média Geral"
                    count={`${kpis.averageBalance} kWh`}
                    description="Saldo médio por UC"
                    priority="info"
                />
            </div>

            {/* Recent Alerts */}
            <AlertsPanel clients={clients} />
        </div>
    );
};

// Componente KPI Card
const KPICard = ({ title, value, subtitle, icon, color }) => (
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

// Componente Chart Card
const ChartCard = ({ title, children }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        {children}
    </div>
);

// Componente Status Distribution Chart (Placeholder)
const StatusDistributionChart = ({ data }) => {
    const statusLabels = {
        active: 'Em Garantia',
        expired: 'Expirada',
        monitoring: 'Monitoramento',
        recurring_maintenance: 'Manutenção',
        om_complete: 'O&M Completo'
    };

    return (
        <div className="space-y-3">
            {Object.entries(data).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                    <span className="text-gray-300">{statusLabels[status] || status}</span>
                    <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(count / Object.values(data).reduce((a, b) => a + b, 0)) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-white font-medium w-8 text-right">{count}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Componente Balance Distribution Chart
const BalanceDistributionChart = ({ clients }) => {
    const ranges = useMemo(() => {
        const ranges = {
            '0 kWh': 0,
            '1-50 kWh': 0,
            '51-100 kWh': 0,
            '101-200 kWh': 0,
            '200+ kWh': 0
        };

        clients.forEach(client => {
            const balance = client.totalBalance || 0;
            if (balance === 0) ranges['0 kWh']++;
            else if (balance <= 50) ranges['1-50 kWh']++;
            else if (balance <= 100) ranges['51-100 kWh']++;
            else if (balance <= 200) ranges['101-200 kWh']++;
            else ranges['200+ kWh']++;
        });

        return ranges;
    }, [clients]);

    return (
        <div className="space-y-3">
            {Object.entries(ranges).map(([range, count]) => (
                <div key={range} className="flex items-center justify-between">
                    <span className="text-gray-300">{range}</span>
                    <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${
                                    range === '0 kWh' ? 'bg-red-500' :
                                    range === '1-50 kWh' ? 'bg-orange-500' :
                                    range === '51-100 kWh' ? 'bg-yellow-500' :
                                    'bg-green-500'
                                }`}
                                style={{ width: `${(count / clients.length) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-white font-medium w-8 text-right">{count}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Componente Opportunity Card
const OpportunityCard = ({ title, count, description, priority }) => {
    const colors = {
        high: 'border-red-500 bg-red-900/20',
        medium: 'border-orange-500 bg-orange-900/20',
        info: 'border-blue-500 bg-blue-900/20'
    };

    return (
        <div className={`p-4 rounded-lg border ${colors[priority]}`}>
            <h4 className="text-white font-semibold">{title}</h4>
            <p className="text-2xl font-bold text-white mt-2">{count}</p>
            <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
    );
};

// Componente Alerts Panel
const AlertsPanel = ({ clients }) => {
    const alerts = useMemo(() => {
        const urgentClients = clients
            .filter(client => (client.totalBalance || 0) === 0)
            .slice(0, 5);

        return urgentClients.map(client => ({
            id: client.id,
            message: `${client.clientNumber || 'S/N'} - ${client.name} está com saldo zero`,
            type: 'urgent',
            client: client
        }));
    }, [clients]);

    if (alerts.length === 0) return null;

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🚨</span>
                Alertas Urgentes
            </h3>
            <div className="space-y-3">
                {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <span className="text-gray-300">{alert.message}</span>
                        <span className="text-red-400 text-sm">Ação necessária</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

window.OverviewDashboard = OverviewDashboard;