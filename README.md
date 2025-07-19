# Solar Analytics Dashboard

Dashboard de Analytics para Gestão Solar - Identificação de Oportunidades

## 📋 Descrição

Sistema desktop desenvolvido em Electron + React para análise e monitoramento de dados de energia solar, identificação de oportunidades de otimização e gestão de clientes.

## 🏗️ Estrutura do Projeto

```
├── src/
│   ├── main/
│   │   └── main.js              # Processo principal Electron
│   ├── preload/
│   │   └── preload.js           # Segurança/ponte
│   └── renderer/
│       ├── index.html           # HTML principal
│       ├── index.js             # Entry point
│       ├── App.jsx              # Componente principal
│       └── components/
│           ├── OverviewDashboard.jsx
│           ├── OpportunitiesDashboard.jsx
│           ├── RegionalDashboard.jsx
│           └── TrendsDashboard.jsx
├── package.json
├── tailwind.config.js
└── README.md
```

## 🚀 Funcionalidades

- **Overview Dashboard**: Visão geral dos dados de energia solar
- **Opportunities Dashboard**: Identificação de oportunidades de otimização
- **Regional Dashboard**: Análise por regiões geográficas
- **Trends Dashboard**: Análise de tendências e previsões

## 🛠️ Tecnologias

- **Electron**: Framework para aplicações desktop
- **React**: Interface de usuário
- **Tailwind CSS**: Estilização
- **Chart.js**: Gráficos e visualizações
- **Firebase**: Banco de dados e autenticação

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Construir CSS do Tailwind
npm run build-css

# Executar em modo desenvolvimento
npm run dev

# Executar aplicação
npm start
```

## 🔧 Scripts Disponíveis

- `npm start` - Executa a aplicação Electron
- `npm run dev` - Executa em modo desenvolvimento com watch do CSS
- `npm run build-css` - Constrói o CSS do Tailwind
- `npm run watch-css` - Monitora mudanças no CSS
- `npm run build` - Constrói a aplicação para distribuição
- `npm run build-win` - Constrói especificamente para Windows

## 🔐 Configuração

A aplicação utiliza Firebase para persistência de dados. As configurações estão no arquivo `src/renderer/index.html`.

## 👨‍💻 Desenvolvimento

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Implemente suas mudanças
4. Execute os testes
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e de propriedade de Pedro Willie.

## 📞 Contato

**Autor**: Pedro Willie  
**Email**: [seu-email@exemplo.com]
