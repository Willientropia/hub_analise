const ClientList = ({ clients, selectedClient, onSelectClient }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.clientNumber || '').includes(searchTerm)
    ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return (
        <div>
            <div className="p-4 sticky top-0 bg-white border-b">
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    className="w-full p-2 border rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ul>
                {filteredClients.map(client => (
                    <li key={client.id}>
                        <button
                            onClick={() => onSelectClient(client)}
                            className={`w-full text-left p-4 text-sm ${selectedClient && selectedClient.id === client.id ? 'bg-indigo-100 text-indigo-800 font-bold' : 'hover:bg-gray-100'}`}
                        >
                            <p className="font-semibold">{client.name || 'Nome não informado'}</p>
                            <p className="text-xs text-gray-500">Nº: {client.clientNumber || 'N/A'}</p>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

window.ClientList = ClientList;