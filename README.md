# Hub de Análise de Dados - Energia Solar

Aplicativo desktop desenvolvido em Electron para análise de dados de clientes de energia solar, conectado ao Firebase para visualização de consumo, economia e histórico de energia.

## 🚀 Funcionalidades

- **Lista de Clientes**: Visualização e busca de todos os clientes solares
- **Dashboard de Análise**: Análise detalhada por cliente com:
  - Cards de resumo (custo total, valor pago, economia gerada)
  - Gráficos de consumo mensal vs economia
  - Tabela histórica detalhada
  - Saldos por unidade consumidora
- **Autenticação Firebase**: Login anônimo automático
- **Interface Responsiva**: Design clean com Tailwind CSS

## 🛠️ Tecnologias

- **Electron**: Framework para aplicativo desktop
- **React 18**: Interface de usuário
- **Firebase Firestore**: Banco de dados em tempo real
- **Chart.js**: Gráficos interativos
- **Tailwind CSS**: Estilização
- **Babel**: Transpilação JSX

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Willientropia/hub_analise.git
cd hub_analise
```

2. Instale as dependências:
```bash
npm install
```

3. Execute a aplicação:
```bash
npm start
```

## 🏗️ Scripts Disponíveis

- `npm start`: Inicia a aplicação Electron
- `npm run build-css`: Compila o CSS do Tailwind
- `npm run watch-css`: Observa mudanças no CSS

## 📂 Estrutura do Projeto

```
hub_analise/
├── src/
│   ├── components/
│   │   ├── AnalysisDashboard.jsx
│   │   └── ClientList.jsx
│   ├── App.jsx
│   ├── index.js
│   └── output.css
├── main.js
├── preload.js
├── index.html
└── package.json
```

## 🔥 Configuração Firebase

O projeto está configurado para conectar ao Firebase com as seguintes coleções:
- `solar-clients`: Dados dos clientes
- `consumerUnits`: Unidades consumidoras (subcoleção)

## 📊 Cálculos de Economia

- **Preço kWh**: R$ 0,99 (configurável)
- **Economia**: (Consumo × Preço kWh) - Valor Pago
- **Agregação**: Dados mensais consolidados por cliente

## 🔐 Segurança

- Autenticação anônima habilitada
- Content Security Policy (CSP) configurada
- Isolamento de contexto habilitado

## 🚧 Desenvolvimento

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🐛 Problemas Conhecidos

- Avisos de cache do Electron (não afetam funcionalidade)
- Erro dragEvent ocasional (não crítico)

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub.
