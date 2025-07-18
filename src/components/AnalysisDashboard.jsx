const { useState, useEffect, useMemo, useRef } = React;

const KWH_PRICE = 0.99; // Preço do kWh para cálculo

const AnalysisDashboard = ({ client }) => {
    const [consumerUnits, setConsumerUnits] = useState([]);
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        if (!client || !window.firebase || !window.firebase.getFirestore) return;

        // Verifica se o usuário está autenticado antes de fazer queries
        const { getAuth } = window.firebase;
        const auth = getAuth();
        
        if (!auth.currentUser) {
            console.warn('Usuário não autenticado, aguardando...');
            return;
        }

        const { getFirestore, collection, onSnapshot, query } = window.firebase;
        const db = getFirestore();
        const q = query(collection(db, `solar-clients/${client.id}/consumerUnits`));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const units = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setConsumerUnits(units);
        }, (error) => {
            console.error('Erro ao buscar unidades consumidoras:', error);
        });

        return () => unsubscribe();
    }, [client]);

    const processedData = useMemo(() => {
        if (!consumerUnits || consumerUnits.length === 0) {
            return { tableRows: [], totals: {}, chartData: { labels: [], datasets: [] }, balances: [] };
        }

        const monthlyData = {};
        consumerUnits.forEach(uc => {
            if (uc.history && Array.isArray(uc.history)) {
                uc.history.forEach(item => {
                    const monthYear = item["Referência"];
                    if (monthYear) {
                        if (!monthlyData[monthYear]) {
                            monthlyData[monthYear] = { totalConsumption: 0, totalPaid: 0 };
                        }
                        monthlyData[monthYear].totalConsumption += parseFloat(item["Consumo(kWh)"]) || 0;
                        monthlyData[monthYear].totalPaid += parseFloat(item["Valor"]) || 0;
                    }
                });
            }
        });

        const labels = Object.keys(monthlyData).sort((a, b) => {
             const [m1, y1] = a.split('/');
             const [m2, y2] = b.split('/');
             return new Date(y1, m1 - 1) - new Date(y2, m2 - 1);
        });

        const tableRows = labels.map(label => {
            const consumption = monthlyData[label]?.totalConsumption || 0;
            const paid = monthlyData[label]?.totalPaid || 0;
            const estimatedCost = consumption * KWH_PRICE;
            const savings = estimatedCost - paid;
            return { label, consumption, paid, savings, estimatedCost };
        });

        const totals = tableRows.reduce((acc, row) => {
            acc.consumption += row.consumption || 0;
            acc.paid += row.paid || 0;
            acc.savings += row.savings || 0;
            acc.estimatedCost += row.estimatedCost || 0;
            return acc;
        }, { consumption: 0, paid: 0, savings: 0, estimatedCost: 0 });

        const balances = consumerUnits.map(uc => ({
            name: uc.name || 'Nome não informado',
            balance: parseFloat(uc.balanceKWH || 0).toFixed(2)
        }));
        
        const chartData = {
            labels,
            datasets: [
                {
                    label: 'Custo Real (Pago)',
                    data: labels.map(l => monthlyData[l]?.totalPaid || 0),
                    backgroundColor: '#4f46e5',
                },
                {
                    label: 'Economia Gerada',
                    data: labels.map(l => ((monthlyData[l]?.totalConsumption || 0) * KWH_PRICE) - (monthlyData[l]?.totalPaid || 0)),
                    backgroundColor: '#f59e0b',
                }
            ]
        };

        return { tableRows, totals, chartData, balances };
    }, [consumerUnits]);

    useEffect(() => {
        if (!chartRef.current || !processedData.chartData.labels.length) return;
        
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstanceRef.current = new Chart(ctx, {
            type: 'bar',
            data: processedData.chartData,
            options: {
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
                plugins: { legend: { position: 'top' } }
            }
        });

    }, [processedData.chartData]);

    if (!client) {
        return <div className="text-center p-10 text-gray-500">Selecione um cliente para ver a análise.</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">{client.name}</h2>
            
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Custo Total sem Solar" value={processedData.totals.estimatedCost} isCurrency={true} color="text-red-600" />
                <StatCard title="Valor Total Pago" value={processedData.totals.paid} isCurrency={true} color="text-blue-600" />
                <StatCard title="Economia Total Gerada" value={processedData.totals.savings} isCurrency={true} color="text-green-600" />
            </div>

            {/* Saldos */}
            <div className="bg-white p-4 rounded-lg shadow">
                 <h3 className="font-semibold mb-2">Saldos por Unidade Consumidora</h3>
                 {processedData.balances.length > 0 ? (
                    <ul className="divide-y">
                        {processedData.balances.map(uc => (
                            <li key={uc.name} className="flex justify-between py-2">
                                <span>{uc.name}</span>
                                <span className={`font-bold ${uc.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>{uc.balance} kWh</span>
                            </li>
                        ))}
                    </ul>
                 ) : <p className="text-sm text-gray-500">Nenhuma unidade consumidora encontrada.</p>}
            </div>

            {/* Gráfico */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Análise Mensal (Custo vs. Economia)</h3>
                <canvas ref={chartRef}></canvas>
            </div>

            {/* Tabela de Histórico */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">Histórico Detalhado</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Mês/Ano</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Consumo (kWh)</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Custo sem Solar</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Valor Pago</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Economia</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {processedData.tableRows.map(row => (
                                <tr key={row.label}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{row.label}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{(row.consumption || 0).toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{(row.estimatedCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600 font-semibold">{(row.paid || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 font-bold">{(row.savings || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold">
                             <tr>
                                 <td className="px-4 py-2">TOTAIS</td>
                                 <td className="px-4 py-2">{(processedData.totals.consumption || 0).toFixed(2)}</td>
                                 <td className="px-4 py-2">{(processedData.totals.estimatedCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                 <td className="px-4 py-2">{(processedData.totals.paid || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                 <td className="px-4 py-2">{(processedData.totals.savings || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                             </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, isCurrency, color }) => (
    <div className="bg-white p-6 rounded-lg shadow text-center">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        <p className={`mt-1 text-3xl font-semibold ${color || 'text-gray-900'}`}>
            {isCurrency ? (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}
        </p>
    </div>
);

window.AnalysisDashboard = AnalysisDashboard;