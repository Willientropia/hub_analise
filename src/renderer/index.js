// Entry point do renderer - Solar Analytics Dashboard
const { createRoot } = ReactDOM;

// Função principal de inicialização
function initializeApp() {
    console.log('🚀 Inicializando Solar Analytics Dashboard...');
    
    // Verificar se todos os elementos necessários estão carregados
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        console.error('❌ React ou ReactDOM não carregados');
        return;
    }

    // Verificar se Firebase está disponível
    if (typeof window.firebase === 'undefined') {
        console.error('❌ Firebase não configurado');
        return;
    }

    // Encontrar o container da aplicação
    const container = document.getElementById('app');
    if (!container) {
        console.error('❌ Container #app não encontrado');
        return;
    }

    // Criar root e renderizar a aplicação
    try {
        const root = createRoot(container);
        root.render(React.createElement(App));
        console.log('✅ App renderizado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao renderizar App:', error);
    }
}

// Aguardar o DOM estar pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Verificação de saúde da aplicação
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`⚡ Dashboard carregado em ${Math.round(loadTime)}ms`);
    
    // Verificar se a aplicação foi montada corretamente
    setTimeout(() => {
        const appElement = document.querySelector('#app > div');
        if (appElement) {
            console.log('✅ Aplicação montada corretamente');
        } else {
            console.warn('⚠️ Aplicação pode não ter sido montada corretamente');
        }
    }, 1000);
});

// Handler global de erros
window.addEventListener('error', (event) => {
    console.error('❌ Erro global capturado:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Handler para Promise rejeitadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada não tratada:', event.reason);
});
