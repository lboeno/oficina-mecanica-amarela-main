// Aplicação principal do sistema de gestão de oficina mecânica

// Estado global da aplicação
let currentSection = 'dashboard';

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Inicializando sistema de gestão da oficina...');
        
        // Inicializar banco de dados
        await db.init();
        console.log('Banco de dados inicializado com sucesso');
        
        // Inicializar componentes
        initializeApp();
        
        // Carregar dados iniciais
        await loadDashboard();
        
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        Utils.showToast('Erro ao inicializar a aplicação. Recarregue a página.', 'error');
    }
});

function initializeApp() {
    // Configurar data atual
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR');
    
    // Configurar menu mobile
    document.getElementById('menu-toggle').addEventListener('click', toggleSidebar);
    
    // Configurar navegação
    setupNavigation();
    
    // Configurar filtros e buscas
    setupSearchFilters();
    
    // Configurar responsividade
    setupResponsiveLayout();
    
    // Inicializar ícones Lucide
    lucide.createIcons();
    
    // Mostrar seção inicial
    showSection('dashboard');
}

function setupResponsiveLayout() {
    // Fechar sidebar quando redimensionar para desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            closeSidebar();
        }
        
        // Configurar indicadores de scroll em tabelas
        setupTableScrollIndicators();
    });
    
    // Fechar sidebar ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.innerWidth < 1024) {
            closeSidebar();
        }
    });
    
    // Configurar indicadores de scroll inicial
    setupTableScrollIndicators();
}

function setupTableScrollIndicators() {
    // Configurar indicadores de scroll horizontal para tabelas em mobile
    if (window.innerWidth < 1024) {
        document.querySelectorAll('.table-responsive').forEach(container => {
            const table = container.querySelector('table');
            if (table && table.scrollWidth > container.clientWidth) {
                container.classList.add('scrollable');
                
                // Adicionar evento de scroll para esconder o indicador
                let scrollTimeout;
                container.addEventListener('scroll', () => {
                    container.classList.add('scrolling');
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        container.classList.remove('scrolling');
                    }, 1000);
                });
            }
        });
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isOpen = sidebar.classList.contains('open');
    
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const body = document.body;
    
    // Adicionar classe open ao sidebar
    sidebar.classList.add('open');
    
    // Criar overlay se não existir
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', closeSidebar);
        body.appendChild(overlay);
    }
    
    // Mostrar overlay
    overlay.classList.add('show');
    
    // Prevenir scroll do body
    body.style.overflow = 'hidden';
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const body = document.body;
    
    // Remover classe open do sidebar
    sidebar.classList.remove('open');
    
    // Esconder overlay
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
    
    // Restaurar scroll do body
    body.style.overflow = '';
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover classe active de todos os links
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            
            // Adicionar classe active ao link clicado
            link.classList.add('active');
        });
    });
}

function setupSearchFilters() {
    // Busca de clientes
    const searchClientes = document.getElementById('search-clientes');
    if (searchClientes) {
        searchClientes.addEventListener('input', debounce(filterClientes, 300));
    }
    
    // Busca de veículos
    const searchVeiculos = document.getElementById('search-veiculos');
    if (searchVeiculos) {
        searchVeiculos.addEventListener('input', debounce(filterVeiculos, 300));
    }
    
    // Busca de peças
    const searchPecas = document.getElementById('search-pecas');
    if (searchPecas) {
        searchPecas.addEventListener('input', debounce(filterPecas, 300));
    }
    
    // Busca de serviços
    const searchServicos = document.getElementById('search-servicos');
    if (searchServicos) {
        searchServicos.addEventListener('input', debounce(filterServicos, 300));
    }
      // Busca de ordens
    const searchOrdens = document.getElementById('search-ordens');
    if (searchOrdens) {
        searchOrdens.addEventListener('input', debounce(applyOrdensFilters, 300));
    }
    
    // Filtro de status das ordens
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', applyOrdensFilters);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showSection(sectionName) {
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });
    
    // Mostrar seção selecionada
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active', 'fade-in');
    }
    
    // Atualizar título da página
    const titles = {
        dashboard: 'Dashboard',
        clientes: 'Clientes',
        veiculos: 'Veículos',
        pecas: 'Peças',
        servicos: 'Serviços',
        ordens: 'Ordens de Serviço'
    };
    
    document.getElementById('page-title').textContent = titles[sectionName] || 'Dashboard';
    currentSection = sectionName;
    
    // Carregar dados da seção se necessário
    loadSectionData(sectionName);
      // Fechar sidebar no mobile
    if (window.innerWidth < 1024) {
        closeSidebar();
    }
}

async function loadSectionData(sectionName) {
    try {
        switch (sectionName) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'clientes':
                await loadClientes();
                break;
            case 'veiculos':
                await loadVeiculos();
                break;
            case 'pecas':
                await loadPecas();
                break;
            case 'servicos':
                await loadServicos();
                break;
            case 'ordens':
                await loadOrdens();
                break;
        }
    } catch (error) {
        console.error(`Erro ao carregar dados da seção ${sectionName}:`, error);
        Utils.showToast(`Erro ao carregar ${sectionName}`, 'error');
    }
}

// Funções de carregamento de dados

async function loadDashboard() {
    const stats = await db.getDashboardStats();
    
    // Atualizar cards de estatísticas
    document.getElementById('total-clientes').textContent = stats.totalClientes;
    document.getElementById('total-veiculos').textContent = stats.totalVeiculos;
    document.getElementById('total-servicos').textContent = stats.totalServicos;
    document.getElementById('total-ordens-abertas').textContent = stats.ordensAbertas;
    document.getElementById('total-pecas').textContent = stats.totalPecas;
      // Atualizar estatísticas do mês
    document.getElementById('servicos-concluidos').textContent = stats.estatisticasMes.servicosConcluidos;
    document.getElementById('receita-total').textContent = Utils.formatCurrency(stats.estatisticasMes.receitaTotal);
    document.getElementById('pecas-utilizadas').textContent = stats.estatisticasMes.pecasUtilizadas;
    
    // Atualizar ordens recentes
    const ordensRecentesContainer = document.getElementById('ordens-recentes');
    if (stats.ordensRecentes.length === 0) {
        ordensRecentesContainer.innerHTML = '<p class="text-gray-500">Nenhuma ordem de serviço encontrada</p>';
    } else {
        ordensRecentesContainer.innerHTML = stats.ordensRecentes.map(ordem => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <p class="font-medium">${ordem.numero}</p>
                    <p class="text-sm text-gray-500">Cliente ID: ${ordem.clienteId}</p>
                </div>
                <span class="status-badge status-${ordem.status}">${getStatusLabel(ordem.status)}</span>
            </div>
        `).join('');
    }
      // Verificar e alertar sobre estoque baixo
    try {
        const pecasEstoqueBaixo = await db.getPecasEstoqueBaixo();
        const alertasEstoqueContainer = document.getElementById('alertas-estoque');
        
        if (pecasEstoqueBaixo.length === 0) {
            alertasEstoqueContainer.innerHTML = '<p class="text-green-600 text-sm">✓ Todos os estoques estão normais</p>';
        } else {
            alertasEstoqueContainer.innerHTML = `
                <div class="space-y-2">
                    <p class="text-red-600 font-medium text-sm">${pecasEstoqueBaixo.length} peça(s) com estoque baixo:</p>
                    ${pecasEstoqueBaixo.map(peca => `
                        <div class="flex justify-between items-center p-2 bg-red-50 rounded border-l-4 border-red-400">
                            <div>
                                <p class="text-sm font-medium text-red-800">${peca.nome}</p>
                                <p class="text-xs text-red-600">Código: ${peca.codigo}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-bold text-red-800">${peca.estoque}</p>
                                <p class="text-xs text-red-600">Mín: ${peca.estoqueMinimo || 0}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Também mostrar um toast para alertas críticos
            const nomes = pecasEstoqueBaixo.map(p => p.nome).join(', ');
            Utils.showToast(`Atenção: ${pecasEstoqueBaixo.length} peça(s) com estoque baixo: ${nomes}`, 'warning');
        }
    } catch (error) {
        console.warn('Erro ao verificar estoque baixo:', error);
        document.getElementById('alertas-estoque').innerHTML = '<p class="text-gray-500 text-sm">Erro ao verificar estoque</p>';
    }
}

async function loadClientes() {
    const clientes = await db.getAllClientes();
    const tbody = document.getElementById('clientes-table');
      if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Nenhum cliente cadastrado</td></tr>';
        return;
    }
      tbody.innerHTML = clientes.map(cliente => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap" data-label="Nome">
                <div class="text-sm font-medium text-gray-900">${cliente.nome}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Email">
                <div class="text-sm text-gray-500">${cliente.email}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Telefone">
                <div class="text-sm text-gray-500">${cliente.telefone}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                <button onclick="editCliente(${cliente.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                    <i data-lucide="edit" class="w-4 h-4"></i>
                </button>                <button onclick="deleteCliente(${cliente.id})" class="text-red-600 hover:text-red-900">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
    setupTableScrollIndicators();
}

async function loadVeiculos() {
    const veiculos = await db.getAllVeiculos();
    const clientes = await db.getAllClientes();
    const tbody = document.getElementById('veiculos-table');
    
    if (veiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhum veículo cadastrado</td></tr>';
        return;
    }
      tbody.innerHTML = veiculos.map(veiculo => {
        const cliente = clientes.find(c => c.id === veiculo.clienteId);
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap" data-label="Placa">
                    <div class="text-sm font-medium text-gray-900">${veiculo.placa}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Marca/Modelo">
                    <div class="text-sm text-gray-900">${veiculo.marca} ${veiculo.modelo}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Ano">
                    <div class="text-sm text-gray-500">${veiculo.ano}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Proprietário">
                    <div class="text-sm text-gray-500">${cliente ? cliente.nome : 'Cliente não encontrado'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                    <button onclick="editVeiculo(${veiculo.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteVeiculo(${veiculo.id})" class="text-red-600 hover:text-red-900">                <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    lucide.createIcons();
    setupTableScrollIndicators();
}

async function loadPecas() {
    const pecas = await db.getAllPecas();
    const tbody = document.getElementById('pecas-table');
    
    if (pecas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhuma peça cadastrada</td></tr>';
        return;
    }
      tbody.innerHTML = pecas.map(peca => {
        const estoqueClass = peca.estoque <= (peca.estoqueMinimo || 0) ? 'estoque-baixo' : 
                           peca.estoque <= (peca.estoqueMinimo || 0) * 2 ? 'estoque-medio' : 'estoque-alto';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap" data-label="Código">
                    <div class="text-sm font-medium text-gray-900">${peca.codigo}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Nome">
                    <div class="text-sm text-gray-900">${peca.nome}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Marca">
                    <div class="text-sm text-gray-500">${peca.marca || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Preço">
                    <div class="text-sm text-gray-900">${Utils.formatCurrency(peca.preco)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Estoque">
                    <div class="text-sm ${estoqueClass}">${peca.estoque}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                    <button onclick="editPeca(${peca.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>                    <button onclick="deletePeca(${peca.id})" class="text-red-600 hover:text-red-900">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    lucide.createIcons();
    setupTableScrollIndicators();
}

async function loadServicos() {
    const servicos = await db.getAllServicos();
    const tbody = document.getElementById('servicos-table');
    
    if (servicos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhum serviço cadastrado</td></tr>';
        return;
    }
      tbody.innerHTML = servicos.map(servico => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap" data-label="Nome">
                <div class="text-sm font-medium text-gray-900">${servico.nome}</div>
            </td>
            <td class="px-6 py-4" data-label="Descrição">
                <div class="text-sm text-gray-500">${servico.descricao || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Preço">
                <div class="text-sm text-gray-900">${Utils.formatCurrency(servico.preco)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Duração">
                <div class="text-sm text-gray-500">${servico.duracaoMinutos ? `${servico.duracaoMinutos} min` : '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                <button onclick="editServico(${servico.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                    <i data-lucide="edit" class="w-4 h-4"></i>
                </button>                <button onclick="deleteServico(${servico.id})" class="text-red-600 hover:text-red-900">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
    setupTableScrollIndicators();
}

async function loadOrdens() {
    const ordens = await db.getAllOrdens();
    const clientes = await db.getAllClientes();
    const veiculos = await db.getAllVeiculos();
    const tbody = document.getElementById('ordens-table');
    
    if (ordens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">Nenhuma ordem de serviço cadastrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = ordens.map(ordem => {
        const cliente = clientes.find(c => c.id === ordem.clienteId);
        const veiculo = veiculos.find(v => v.id === ordem.veiculoId);        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap" data-label="Nº Ordem">
                    <div class="text-sm font-medium text-gray-900">${ordem.numero || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Cliente">
                    <div class="text-sm text-gray-900">${cliente ? cliente.nome : 'Cliente não encontrado'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Veículo">
                    <div class="text-sm text-gray-500">${veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo não encontrado'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Status">
                    <span class="status-badge status-${ordem.status}">${getStatusLabel(ordem.status)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Data">
                    <div class="text-sm text-gray-500">${Utils.formatDate(ordem.dataAbertura)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Total">
                    <div class="text-sm text-gray-900">${Utils.formatCurrency(ordem.valorTotal || 0)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                    <button onclick="shareOrdem(${ordem.id})" class="text-blue-600 hover:text-blue-900 mr-3" title="Compartilhar">
                        <i data-lucide="share-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="editOrdem(${ordem.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>                    <button onclick="deleteOrdem(${ordem.id})" class="text-red-600 hover:text-red-900">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');    
    lucide.createIcons();
    setupTableScrollIndicators();
    
    // Remover linha de "nenhum resultado" se existir
    const noResultRow = tbody.querySelector('.no-results-row');
    if (noResultRow) {
        noResultRow.remove();
    }
}

// Funções de salvamento
async function saveCliente(id = null) {
    try {        const cliente = {
            nome: document.getElementById('cliente-nome').value,
            email: document.getElementById('cliente-email').value,
            telefone: document.getElementById('cliente-telefone').value,
            endereco: document.getElementById('cliente-endereco').value
        };
        
        // Validações
        if (!Utils.validateEmail(cliente.email)) {
            Utils.showToast('Email inválido', 'error');
            return;
        }
        
        if (id) {
            cliente.id = id;
            await db.updateCliente(cliente);
            Utils.showToast('Cliente atualizado com sucesso', 'success');
        } else {
            await db.addCliente(cliente);
            Utils.showToast('Cliente adicionado com sucesso', 'success');
        }
        
        await loadClientes();
        await loadDashboard();
        
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        Utils.showToast('Erro ao salvar cliente', 'error');
    }
}

async function saveVeiculo(id = null) {
    try {
        const veiculo = {
            placa: document.getElementById('veiculo-placa').value.toUpperCase(),
            clienteId: parseInt(document.getElementById('veiculo-cliente').value),
            marca: document.getElementById('veiculo-marca').value,
            modelo: document.getElementById('veiculo-modelo').value,
            ano: parseInt(document.getElementById('veiculo-ano').value),
            cor: document.getElementById('veiculo-cor').value,
            observacoes: document.getElementById('veiculo-observacoes').value
        };
        
        if (id) {
            veiculo.id = id;
            await db.updateVeiculo(veiculo);
            Utils.showToast('Veículo atualizado com sucesso', 'success');
        } else {
            await db.addVeiculo(veiculo);
            Utils.showToast('Veículo adicionado com sucesso', 'success');
        }
        
        await loadVeiculos();
        await loadDashboard();
        
    } catch (error) {
        console.error('Erro ao salvar veículo:', error);
        Utils.showToast('Erro ao salvar veículo', 'error');
    }
}

async function savePeca(id = null) {
    try {
        const peca = {
            codigo: document.getElementById('peca-codigo').value,
            nome: document.getElementById('peca-nome').value,
            marca: document.getElementById('peca-marca').value,
            preco: parseFloat(document.getElementById('peca-preco').value),
            estoque: parseInt(document.getElementById('peca-estoque').value),
            estoqueMinimo: parseInt(document.getElementById('peca-estoque-minimo').value) || 0,
            descricao: document.getElementById('peca-descricao').value
        };
        
        if (id) {
            peca.id = id;
            await db.updatePeca(peca);
            Utils.showToast('Peça atualizada com sucesso', 'success');
        } else {
            await db.addPeca(peca);
            Utils.showToast('Peça adicionada com sucesso', 'success');
        }
        
        await loadPecas();
        await loadDashboard();
        
    } catch (error) {
        console.error('Erro ao salvar peça:', error);
        Utils.showToast('Erro ao salvar peça', 'error');
    }
}

async function saveServico(id = null) {
    try {
        const servico = {
            nome: document.getElementById('servico-nome').value,
            descricao: document.getElementById('servico-descricao').value,
            preco: parseFloat(document.getElementById('servico-preco').value),
            duracaoMinutos: parseInt(document.getElementById('servico-duracao').value) || null
        };
        
        if (id) {
            servico.id = id;
            await db.updateServico(servico);
            Utils.showToast('Serviço atualizado com sucesso', 'success');
        } else {
            await db.addServico(servico);
            Utils.showToast('Serviço adicionado com sucesso', 'success');
        }
        
        await loadServicos();
        
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        Utils.showToast('Erro ao salvar serviço', 'error');
    }
}

async function saveOrdem(id = null) {
    try {
        // Coletar serviços
        const servicos = [];
        document.querySelectorAll('.servico-select').forEach(select => {
            if (select.value) {
                const quantidade = parseInt(select.parentElement.querySelector('.quantidade-servico').value) || 1;
                servicos.push({
                    servicoId: parseInt(select.value),
                    quantidade: quantidade
                });
            }
        });
        
        // Coletar peças
        const pecas = [];
        document.querySelectorAll('.peca-select').forEach(select => {
            if (select.value) {
                const quantidade = parseInt(select.parentElement.querySelector('.quantidade-peca').value) || 1;
                pecas.push({
                    pecaId: parseInt(select.value),
                    quantidade: quantidade
                });
            }
        });
        
        // Verificar estoque das peças ANTES de salvar
        const allPecas = await db.getAllPecas();
        for (const pecaOrdem of pecas) {
            const peca = allPecas.find(p => p.id === pecaOrdem.pecaId);
            if (peca && peca.estoque < pecaOrdem.quantidade) {
                Utils.showToast(`Estoque insuficiente para a peça: ${peca.nome}. Disponível: ${peca.estoque}`, 'error');
                return;
            }
        }
        
        // Calcular valor total
        let valorTotal = 0;
        const allServicos = await db.getAllServicos();
        
        servicos.forEach(s => {
            const servico = allServicos.find(srv => srv.id === s.servicoId);
            if (servico) valorTotal += servico.preco * s.quantidade;
        });
        
        pecas.forEach(p => {
            const peca = allPecas.find(pc => pc.id === p.pecaId);
            if (peca) valorTotal += peca.preco * p.quantidade;
        });        const dataEntrega = document.getElementById('ordem-data-entrega').value;
        const status = document.getElementById('ordem-status').value;
        
        const ordem = {
            clienteId: parseInt(document.getElementById('ordem-cliente').value),
            veiculoId: parseInt(document.getElementById('ordem-veiculo').value),
            status: status,
            descricaoProblema: document.getElementById('ordem-descricao').value,
            observacoes: document.getElementById('ordem-observacoes').value,
            dataEntregaPrevista: dataEntrega ? new Date(dataEntrega).toISOString() : null,
            servicos: servicos,
            pecas: pecas,
            valorTotal: valorTotal
        };
        
        // Definir data de conclusão automaticamente se status for "concluída"
        if (status === 'concluida') {
            ordem.dataConclusao = new Date().toISOString();
        } else {
            // Se não estiver concluída, manter null ou preservar data existente se estava concluída antes
            if (id) {
                const ordemExistente = await db.getOrdemById(id);
                if (ordemExistente && ordemExistente.status === 'concluida' && status !== 'concluida') {
                    ordem.dataConclusao = null; // Remover data de conclusão se mudou de concluída para outro status
                } else if (ordemExistente && ordemExistente.dataConclusao && status !== 'concluida') {
                    ordem.dataConclusao = null;
                }
            }
        }
        
        // Se estiver editando uma ordem, primeiro restaurar o estoque das peças antigas
        if (id) {
            const ordemAntiga = await db.getOrdemById(id);
            if (ordemAntiga && ordemAntiga.pecas) {
                await restaurarEstoque(ordemAntiga.pecas);
            }
        }
        
        // Atualizar estoque das peças (diminuir)
        await atualizarEstoque(pecas, 'subtrair');
          if (id) {
            ordem.id = id;
            // Garantir que o número da ordem seja preservado
            const ordemExistente = await db.getOrdemById(id);
            if (ordemExistente && ordemExistente.numero) {
                ordem.numero = ordemExistente.numero;
            }
            await db.updateOrdem(ordem);
            Utils.showToast('Ordem atualizada com sucesso', 'success');
        } else {
            await db.addOrdem(ordem);
            Utils.showToast('Ordem criada com sucesso', 'success');
        }
        
        await loadOrdens();
        await loadDashboard();
        await loadPecas(); // Recarregar peças para mostrar estoque atualizado
        
    } catch (error) {
        console.error('Erro ao salvar ordem:', error);
        Utils.showToast('Erro ao salvar ordem', 'error');
    }
}

// Funções de edição
async function editCliente(id) {
    const cliente = await db.getClienteById(id);
    if (cliente) {
        openClienteModal(cliente);
    }
}

async function editVeiculo(id) {
    const veiculo = await db.getVeiculoById(id);
    if (veiculo) {
        openVeiculoModal(veiculo);
    }
}

async function editPeca(id) {
    const peca = await db.getPecaById(id);
    if (peca) {
        openPecaModal(peca);
    }
}

async function editServico(id) {
    const servico = await db.getServicoById(id);
    if (servico) {
        openServicoModal(servico);
    }
}

async function editOrdem(id) {
    const ordem = await db.getOrdemById(id);
    if (ordem) {
        openOrdemModal(ordem);
    }
}

// Funções de exclusão
async function deleteCliente(id) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            await db.delete('clientes', id);
            Utils.showToast('Cliente excluído com sucesso', 'success');
            await loadClientes();
            await loadDashboard();
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            Utils.showToast('Erro ao excluir cliente', 'error');
        }
    }
}

async function deleteVeiculo(id) {
    if (confirm('Tem certeza que deseja excluir este veículo?')) {
        try {
            await db.delete('veiculos', id);
            Utils.showToast('Veículo excluído com sucesso', 'success');
            await loadVeiculos();
            await loadDashboard();
        } catch (error) {
            console.error('Erro ao excluir veículo:', error);
            Utils.showToast('Erro ao excluir veículo', 'error');
        }
    }
}

async function deletePeca(id) {
    if (confirm('Tem certeza que deseja excluir esta peça?')) {
        try {
            await db.delete('pecas', id);
            Utils.showToast('Peça excluída com sucesso', 'success');
            await loadPecas();
            await loadDashboard();
        } catch (error) {
            console.error('Erro ao excluir peça:', error);
            Utils.showToast('Erro ao excluir peça', 'error');
        }
    }
}

async function deleteServico(id) {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
        try {
            await db.delete('servicos', id);
            Utils.showToast('Serviço excluído com sucesso', 'success');
            await loadServicos();
        } catch (error) {
            console.error('Erro ao excluir serviço:', error);
            Utils.showToast('Erro ao excluir serviço', 'error');
        }
    }
}

async function deleteOrdem(id) {
    if (confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
        try {
            // Primeiro, restaurar o estoque das peças da ordem
            const ordem = await db.getOrdemById(id);
            if (ordem && ordem.pecas) {
                await restaurarEstoque(ordem.pecas);
            }
            
            await db.delete('ordens', id);
            Utils.showToast('Ordem excluída com sucesso', 'success');
            await loadOrdens();
            await loadDashboard();
            await loadPecas(); // Recarregar peças para mostrar estoque atualizado
        } catch (error) {
            console.error('Erro ao excluir ordem:', error);
            Utils.showToast('Erro ao excluir ordem', 'error');
        }
    }
}

// Funções de filtro/busca
function filterClientes() {
    const searchTerm = document.getElementById('search-clientes').value.toLowerCase();
    const rows = document.querySelectorAll('#clientes-table tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterVeiculos() {
    const searchTerm = document.getElementById('search-veiculos').value.toLowerCase();
    const rows = document.querySelectorAll('#veiculos-table tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterPecas() {
    const searchTerm = document.getElementById('search-pecas').value.toLowerCase();
    const rows = document.querySelectorAll('#pecas-table tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterServicos() {
    const searchTerm = document.getElementById('search-servicos').value.toLowerCase();
    const rows = document.querySelectorAll('#servicos-table tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterOrdens() {
    const searchTerm = document.getElementById('search-ordens')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('')?.value || '';
    const rows = document.querySelectorAll('#ordens-table tr');
    
    if (rows.length === 0) return;
    
    let visibleCount = 0;
    
    rows.forEach(row => {
        // Pular linhas que não têm células de dados (ex: cabeçalho)
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) {
            return;
        }
        
        const text = row.textContent.toLowerCase();
        const statusBadge = row.querySelector('.status-badge');
        
        // Extrair status corretamente das classes CSS
        let status = '';
        if (statusBadge) {
            const classes = statusBadge.className.split(' ');
            const statusClass = classes.find(cls => cls.startsWith('status-'));
            if (statusClass) {
                status = statusClass.replace('status-', '');
            }
        }
        
        const matchesSearch = searchTerm === '' || text.includes(searchTerm);
        const matchesStatus = statusFilter === '' || status === statusFilter;
        
        const shouldShow = matchesSearch && matchesStatus;
        row.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) {
            visibleCount++;
        }
    });
    
    // Mostrar mensagem se nenhuma ordem for encontrada
    const tbody = document.getElementById('ordens-table');
    if (visibleCount === 0 && tbody && (searchTerm !== '' || statusFilter !== '')) {
        // Verificar se já existe uma linha de "nenhum resultado"
        let noResultRow = tbody.querySelector('.no-results-row');
        if (!noResultRow) {
            noResultRow = document.createElement('tr');
            noResultRow.className = 'no-results-row';
            noResultRow.innerHTML = '<td colspan="7" class="text-center py-4 text-gray-500">Nenhuma ordem encontrada com os filtros aplicados</td>';
            tbody.appendChild(noResultRow);
        }
        noResultRow.style.display = '';
    } else {
        // Remover linha de "nenhum resultado" se existir
        const noResultRow = tbody?.querySelector('.no-results-row');
        if (noResultRow) {
            noResultRow.style.display = 'none';
        }
    }
}

// Função para aplicar filtros com feedback visual
function applyOrdensFilters() {
    const searchTerm = document.getElementById('search-ordens')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';
    
    if (searchTerm === '' && statusFilter === '') {
        // Se não há filtros, remover qualquer linha de "nenhum resultado"
        const tbody = document.getElementById('ordens-table');
        const noResultRow = tbody?.querySelector('.no-results-row');
        if (noResultRow) {
            noResultRow.style.display = 'none';
        }
        
        // Mostrar todas as linhas
        const rows = document.querySelectorAll('#ordens-table tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                row.style.display = '';
            }
        });
        
        // Atualizar contador
        updateOrdensCounter();
        return;
    }
    
    // Aplicar filtros normalmente
    filterOrdens();
    updateOrdensCounter();
}

// Função para atualizar contador de ordens visíveis
function updateOrdensCounter() {
    const rows = document.querySelectorAll('#ordens-table tr');
    let visibleCount = 0;
    let totalCount = 0;
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0 && !row.classList.contains('no-results-row')) {
            totalCount++;
            if (row.style.display !== 'none') {
                visibleCount++;
            }
        }
    });
    
    // Atualizar título da seção com contador
    const sectionTitle = document.querySelector('#ordens-section h3');
    if (sectionTitle) {
        const baseTitle = 'Gerenciar Ordens de Serviço';
        if (visibleCount < totalCount) {
            sectionTitle.textContent = `${baseTitle} (${visibleCount} de ${totalCount})`;
        } else {
            sectionTitle.textContent = baseTitle;
        }
    }
}

// Funções auxiliares
function getStatusLabel(status) {
    const labels = {
        'aberta': 'Aberta',
        'em_andamento': 'Em Andamento',
        'concluida': 'Concluída',
        'cancelada': 'Cancelada'
    };
    return labels[status] || status;
}

// Funções auxiliares para controle de estoque
async function atualizarEstoque(pecas, operacao = 'subtrair') {
    for (const pecaOrdem of pecas) {
        const peca = await db.getPecaById(pecaOrdem.pecaId);
        if (peca) {
            if (operacao === 'subtrair') {
                peca.estoque -= pecaOrdem.quantidade;
            } else if (operacao === 'somar') {
                peca.estoque += pecaOrdem.quantidade;
            }
            
            // Garantir que o estoque não fique negativo
            peca.estoque = Math.max(0, peca.estoque);
            
            await db.updatePeca(peca);
        }
    }
}

async function restaurarEstoque(pecas) {
    await atualizarEstoque(pecas, 'somar');
}

// Funções de backup e restauração
async function exportBackup() {
    try {
        Utils.showToast('Exportando backup...', 'info');
        
        const backupData = await db.exportAllData();
        
        // Criar arquivo JSON para download
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Criar link de download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `oficina-backup-${timestamp}.json`;
        
        // Simular clique para iniciar download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpar URL object
        URL.revokeObjectURL(link.href);
        
        Utils.showToast('Backup exportado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar backup:', error);
        Utils.showToast('Erro ao exportar backup: ' + error.message, 'error');
    }
}

async function importBackup(backupData) {
    try {
        Utils.showToast('Importando backup...', 'info');
        
        await db.importAllData(backupData);
        
        // Recarregar dados na interface
        await loadDashboard();
        await loadClientes();
        await loadVeiculos();
        await loadPecas();
        await loadServicos();
        await loadOrdens();
        
        Utils.showToast('Backup importado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao importar backup:', error);
        Utils.showToast('Erro ao importar backup: ' + error.message, 'error');
        throw error;
    }
}

async function clearDatabase() {
    try {
        Utils.showToast('Limpando banco de dados...', 'info');
        
        await db.clearAllData();
        
        // Recarregar dados na interface
        await loadDashboard();
        await loadClientes();
        await loadVeiculos();
        await loadPecas();
        await loadServicos();
        await loadOrdens();
        
        // Fechar modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
        
        Utils.showToast('Banco de dados limpo com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao limpar banco:', error);
        Utils.showToast('Erro ao limpar banco de dados: ' + error.message, 'error');
    }
}

// Dados de demonstração
const demoData = {
    clientes: [
        {
            nome: "João Silva Santos",
            email: "joao.silva@email.com",
            telefone: "(11) 99876-5432",
            endereco: "Rua das Flores, 123 - Vila Madalena, São Paulo - SP"
        },
        {
            nome: "Maria Oliveira Costa",
            email: "maria.oliveira@email.com",
            telefone: "(11) 98765-4321",
            endereco: "Av. Paulista, 456 - Bela Vista, São Paulo - SP"
        },
        {
            nome: "Carlos Eduardo Lima",
            email: "carlos.lima@email.com",
            telefone: "(11) 97654-3210",
            endereco: "Rua Augusta, 789 - Consolação, São Paulo - SP"
        },
        {
            nome: "Ana Carolina Ferreira",
            email: "ana.ferreira@email.com",
            telefone: "(11) 96543-2109",
            endereco: "Rua Oscar Freire, 321 - Jardins, São Paulo - SP"
        },
        {
            nome: "Roberto Souza Almeida",
            email: "roberto.almeida@email.com",
            telefone: "(11) 95432-1098",
            endereco: "Av. Faria Lima, 654 - Itaim Bibi, São Paulo - SP"
        }
    ],
    pecas: [
        { codigo: "FL001", nome: "Filtro de Óleo", marca: "Tecfil", preco: 25.90, estoque: 50, estoqueMinimo: 10 },
        { codigo: "FL002", nome: "Filtro de Ar", marca: "Tecfil", preco: 35.50, estoque: 30, estoqueMinimo: 8 },
        { codigo: "FL003", nome: "Filtro de Combustível", marca: "Bosch", preco: 45.00, estoque: 25, estoqueMinimo: 5 },
        { codigo: "PV001", nome: "Vela de Ignição", marca: "NGK", preco: 18.90, estoque: 100, estoqueMinimo: 20 },
        { codigo: "OL001", nome: "Óleo Motor 5W30", marca: "Mobil", preco: 65.00, estoque: 40, estoqueMinimo: 10 },
        { codigo: "FR001", nome: "Pastilha de Freio Dianteira", marca: "Bosch", preco: 85.50, estoque: 20, estoqueMinimo: 4 },
        { codigo: "FR002", nome: "Disco de Freio", marca: "Fremax", preco: 120.00, estoque: 15, estoqueMinimo: 3 },
        { codigo: "PN001", nome: "Pneu 185/60 R15", marca: "Pirelli", preco: 280.00, estoque: 12, estoqueMinimo: 4 },
        { codigo: "BT001", nome: "Bateria 60Ah", marca: "Moura", preco: 320.00, estoque: 8, estoqueMinimo: 2 },
        { codigo: "CR001", nome: "Correia Dentada", marca: "Gates", preco: 95.00, estoque: 18, estoqueMinimo: 5 },
        { codigo: "AM001", nome: "Amortecedor Dianteiro", marca: "Monroe", preco: 180.00, estoque: 10, estoqueMinimo: 2 },
        { codigo: "RL001", nome: "Rolamento Roda Dianteira", marca: "SKF", preco: 75.00, estoque: 16, estoqueMinimo: 4 },
        { codigo: "LQ001", nome: "Líquido Arrefecimento", marca: "Valvoline", preco: 28.90, estoque: 35, estoqueMinimo: 8 },
        { codigo: "LF001", nome: "Fluido de Freio", marca: "Bosch", preco: 22.50, estoque: 25, estoqueMinimo: 6 },
        { codigo: "ES001", nome: "Escapamento Completo", marca: "Fiesta", preco: 450.00, estoque: 5, estoqueMinimo: 1 }
    ],
    servicos: [
        { nome: "Troca de Óleo", descricao: "Troca de óleo do motor e filtro", preco: 80.00, duracao: 30 },
        { nome: "Alinhamento", descricao: "Alinhamento de direção", preco: 60.00, duracao: 45 },
        { nome: "Balanceamento", descricao: "Balanceamento das rodas", preco: 40.00, duracao: 30 },
        { nome: "Revisão Completa", descricao: "Revisão geral do veículo", preco: 350.00, duracao: 180 },
        { nome: "Troca de Pastilha", descricao: "Substituição das pastilhas de freio", preco: 150.00, duracao: 60 },
        { nome: "Troca de Pneus", descricao: "Montagem e desmontagem de pneus", preco: 25.00, duracao: 20 },
        { nome: "Diagnóstico Eletrônico", descricao: "Diagnóstico com scanner automotivo", preco: 100.00, duracao: 60 },
        { nome: "Troca de Bateria", descricao: "Substituição da bateria", preco: 50.00, duracao: 15 },
        { nome: "Limpeza de Bicos", descricao: "Limpeza do sistema de injeção", preco: 120.00, duracao: 90 },
        { nome: "Ar Condicionado", descricao: "Manutenção do sistema de ar condicionado", preco: 180.00, duracao: 120 }
    ]
};

async function loadDemoData() {
    try {
        Utils.showToast('Carregando dados de demonstração...', 'info');
        
        // Adicionar clientes
        const clienteIds = [];
        for (const cliente of demoData.clientes) {
            const id = await db.addCliente(cliente);
            clienteIds.push(id);
        }
        
        // Adicionar veículos para os clientes
        const veiculos = [
            { placa: "ABC-1234", clienteId: clienteIds[0], marca: "Toyota", modelo: "Corolla", ano: 2020, cor: "Branco", observacoes: "Carro em ótimo estado" },
            { placa: "DEF-5678", clienteId: clienteIds[0], marca: "Honda", modelo: "Civic", ano: 2019, cor: "Prata", observacoes: "" },
            { placa: "GHI-9012", clienteId: clienteIds[1], marca: "Volkswagen", modelo: "Golf", ano: 2021, cor: "Azul", observacoes: "Revisão em dia" },
            { placa: "JKL-3456", clienteId: clienteIds[2], marca: "Ford", modelo: "Focus", ano: 2018, cor: "Preto", observacoes: "Pequenos riscos na lataria" },
            { placa: "MNO-7890", clienteId: clienteIds[2], marca: "Chevrolet", modelo: "Onix", ano: 2022, cor: "Vermelho", observacoes: "Carro novo" },
            { placa: "PQR-1357", clienteId: clienteIds[3], marca: "Hyundai", modelo: "HB20", ano: 2020, cor: "Branco", observacoes: "" },
            { placa: "STU-2468", clienteId: clienteIds[4], marca: "Nissan", modelo: "Versa", ano: 2019, cor: "Prata", observacoes: "Barulho no motor" },
            { placa: "VWX-9753", clienteId: clienteIds[4], marca: "Fiat", modelo: "Argo", ano: 2021, cor: "Azul", observacoes: "Primeira revisão" }
        ];
        
        const veiculoIds = [];
        for (const veiculo of veiculos) {
            const id = await db.addVeiculo(veiculo);
            veiculoIds.push(id);
        }
        
        // Adicionar peças
        for (const peca of demoData.pecas) {
            await db.addPeca(peca);
        }
        
        // Adicionar serviços
        const servicoIds = [];
        for (const servico of demoData.servicos) {
            const id = await db.addServico(servico);
            servicoIds.push(id);
        }
        
        // Adicionar ordens de serviço
        const ordens = [
            {
                numero: "OS-2025-001",
                clienteId: clienteIds[0],
                veiculoId: veiculoIds[0],
                status: "concluida",
                dataAbertura: "2025-05-28T09:00:00.000Z",
                dataConclusao: "2025-05-28T11:30:00.000Z",
                descricaoProblema: "Troca de óleo e filtro",
                observacoes: "Serviço realizado conforme agendado",
                servicosIds: [servicoIds[0]],
                pecasIds: [],
                valorTotal: 105.90
            },
            {
                numero: "OS-2025-002",
                clienteId: clienteIds[1],
                veiculoId: veiculoIds[2],
                status: "em_andamento",
                dataAbertura: "2025-06-04T14:00:00.000Z",
                dataConclusao: null,
                descricaoProblema: "Alinhamento e balanceamento",
                observacoes: "Aguardando peças",
                servicosIds: [servicoIds[1], servicoIds[2]],
                pecasIds: [],
                valorTotal: 100.00
            },
            {
                numero: "OS-2025-003",
                clienteId: clienteIds[2],
                veiculoId: veiculoIds[3],
                status: "aberta",
                dataAbertura: "2025-06-05T08:30:00.000Z",
                dataConclusao: null,
                descricaoProblema: "Revisão completa do veículo",
                observacoes: "Cliente solicitou revisão de 60mil km",
                servicosIds: [servicoIds[3]],
                pecasIds: [],
                valorTotal: 350.00
            },
            {
                numero: "OS-2025-004",
                clienteId: clienteIds[3],
                veiculoId: veiculoIds[5],
                status: "concluida",
                dataAbertura: "2025-06-01T10:00:00.000Z",
                dataConclusao: "2025-06-01T12:00:00.000Z",
                descricaoProblema: "Troca de pastilhas de freio",
                observacoes: "Pastilhas estavam no limite",
                servicosIds: [servicoIds[4]],
                pecasIds: [],
                valorTotal: 235.50
            },
            {
                numero: "OS-2025-005",
                clienteId: clienteIds[4],
                veiculoId: veiculoIds[6],
                status: "em_andamento",
                dataAbertura: "2025-06-03T16:00:00.000Z",
                dataConclusao: null,
                descricaoProblema: "Diagnóstico de ruído no motor",
                observacoes: "Investigando origem do barulho",
                servicosIds: [servicoIds[6]],
                pecasIds: [],
                valorTotal: 100.00
            },
            {
                numero: "OS-2025-006",
                clienteId: clienteIds[4],
                veiculoId: veiculoIds[7],
                status: "aberta",
                dataAbertura: "2025-06-05T13:00:00.000Z",
                dataConclusao: null,
                descricaoProblema: "Primeira revisão do veículo",
                observacoes: "Revisão de garantia",
                servicosIds: [servicoIds[0], servicoIds[1]],
                pecasIds: [],
                valorTotal: 140.00
            }
        ];
        
        for (const ordem of ordens) {
            await db.addOrdem(ordem);
        }
        
        // Recarregar dados na interface
        await loadDashboard();
        await loadClientes();
        await loadVeiculos();
        await loadPecas();
        await loadServicos();
        await loadOrdens();
        
        // Fechar modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
        
        Utils.showToast('Dados de demonstração carregados com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao carregar dados de demonstração:', error);
        Utils.showToast('Erro ao carregar dados: ' + error.message, 'error');
    }
}

// Sistema de ordenação para tabelas
class TableSorter {
    constructor() {
        this.currentSort = {};
        this.setupSortableHeaders();
    }

    setupSortableHeaders() {
        // Configurar event listeners para todos os cabeçalhos sortable
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('sortable-header')) {
                this.handleSort(e.target);
            }
        });
    }

    handleSort(header) {
        const table = header.closest('table');
        const tableId = table.querySelector('tbody').id;
        const sortField = header.dataset.sort;

        // Determinar direção da ordenação
        const currentDirection = this.currentSort[tableId]?.field === sortField ? 
            this.currentSort[tableId].direction : null;
        
        let newDirection = 'asc';
        if (currentDirection === 'asc') {
            newDirection = 'desc';
        }

        // Atualizar estado da ordenação
        this.currentSort[tableId] = {
            field: sortField,
            direction: newDirection
        };

        // Atualizar indicadores visuais
        this.updateSortIndicators(table, header, newDirection);

        // Ordenar dados baseado na tabela
        this.sortTableData(tableId, sortField, newDirection);
    }

    updateSortIndicators(table, activeHeader, direction) {
        // Remover indicadores de todos os cabeçalhos
        table.querySelectorAll('.sortable-header').forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
        });

        // Adicionar indicador ao cabeçalho ativo
        activeHeader.classList.add(direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }

    sortTableData(tableId, sortField, direction) {
        // Determinar qual função de carregamento chamar baseado no ID da tabela
        switch (tableId) {
            case 'clientes-table':
                this.sortAndReloadClientes(sortField, direction);
                break;
            case 'veiculos-table':
                this.sortAndReloadVeiculos(sortField, direction);
                break;
            case 'pecas-table':
                this.sortAndReloadPecas(sortField, direction);
                break;
            case 'servicos-table':
                this.sortAndReloadServicos(sortField, direction);
                break;
            case 'ordens-table':
                this.sortAndReloadOrdens(sortField, direction);
                break;
        }
    }

    async sortAndReloadClientes(sortField, direction) {
        try {
            const clientes = await db.getAllClientes();
            const sortedClientes = this.sortArray(clientes, sortField, direction);
            this.renderClientesTable(sortedClientes);
        } catch (error) {
            console.error('Erro ao ordenar clientes:', error);
        }
    }

    async sortAndReloadVeiculos(sortField, direction) {
        try {
            const veiculos = await db.getAllVeiculos();
            const clientes = await db.getAllClientes();
            
            // Adicionar nome do proprietário para ordenação
            const veiculosComProprietario = veiculos.map(veiculo => {
                const cliente = clientes.find(c => c.id === veiculo.clienteId);
                return {
                    ...veiculo,
                    proprietario: cliente ? cliente.nome : 'Cliente não encontrado',
                    marca: `${veiculo.marca} ${veiculo.modelo}`
                };
            });

            const sortedVeiculos = this.sortArray(veiculosComProprietario, sortField, direction);
            this.renderVeiculosTable(sortedVeiculos, clientes);
        } catch (error) {
            console.error('Erro ao ordenar veículos:', error);
        }
    }

    async sortAndReloadPecas(sortField, direction) {
        try {
            const pecas = await db.getAllPecas();
            const sortedPecas = this.sortArray(pecas, sortField, direction);
            this.renderPecasTable(sortedPecas);
        } catch (error) {
            console.error('Erro ao ordenar peças:', error);
        }
    }

    async sortAndReloadServicos(sortField, direction) {
        try {
            const servicos = await db.getAllServicos();
            const sortedServicos = this.sortArray(servicos, sortField, direction);
            this.renderServicosTable(sortedServicos);
        } catch (error) {
            console.error('Erro ao ordenar serviços:', error);
        }
    }

    async sortAndReloadOrdens(sortField, direction) {
        try {
            const ordens = await db.getAllOrdens();
            const clientes = await db.getAllClientes();
            const veiculos = await db.getAllVeiculos();
            
            // Adicionar dados relacionados para ordenação
            const ordensComDados = ordens.map(ordem => {
                const cliente = clientes.find(c => c.id === ordem.clienteId);
                const veiculo = veiculos.find(v => v.id === ordem.veiculoId);
                return {
                    ...ordem,
                    cliente: cliente ? cliente.nome : 'Cliente não encontrado',
                    veiculo: veiculo ? `${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}` : 'Veículo não encontrado'
                };
            });

            const sortedOrdens = this.sortArray(ordensComDados, sortField, direction);
            this.renderOrdensTable(sortedOrdens, clientes, veiculos);
        } catch (error) {
            console.error('Erro ao ordenar ordens:', error);
        }
    }

    sortArray(array, field, direction) {
        return array.sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];

            // Tratar valores nulos/undefined
            if (valueA === null || valueA === undefined) valueA = '';
            if (valueB === null || valueB === undefined) valueB = '';

            // Converter para string se não for número
            if (typeof valueA === 'string') valueA = valueA.toLowerCase();
            if (typeof valueB === 'string') valueB = valueB.toLowerCase();

            // Comparação para números - incluir duracaoMinutos
            if (field === 'preco' || field === 'valorTotal' || field === 'estoque' || field === 'ano' || field === 'duracaoMinutos') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            }

            // Comparação para datas
            if (field === 'dataAbertura' || field === 'dataCriacao') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            }

            let comparison = 0;
            if (valueA > valueB) {
                comparison = 1;
            } else if (valueA < valueB) {
                comparison = -1;
            }

            return direction === 'desc' ? comparison * -1 : comparison;
        });
    }

    renderClientesTable(clientes) {
        const tbody = document.getElementById('clientes-table');
        tbody.innerHTML = clientes.map(cliente => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap" data-label="Nome">
                    <div class="text-sm font-medium text-gray-900">${cliente.nome}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Email">
                    <div class="text-sm text-gray-500">${cliente.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Telefone">
                    <div class="text-sm text-gray-500">${cliente.telefone}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                    <button onclick="editCliente(${cliente.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteCliente(${cliente.id})" class="text-red-600 hover:text-red-900">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        lucide.createIcons();
    }

    renderVeiculosTable(veiculos, clientes) {
        const tbody = document.getElementById('veiculos-table');
        tbody.innerHTML = veiculos.map(veiculo => {
            const cliente = clientes.find(c => c.id === veiculo.clienteId);
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Placa">
                        <div class="text-sm font-medium text-gray-900">${veiculo.placa}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Marca/Modelo">
                        <div class="text-sm text-gray-900">${veiculo.marca} ${veiculo.modelo}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Ano">
                        <div class="text-sm text-gray-500">${veiculo.ano}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Proprietário">
                        <div class="text-sm text-gray-500">${cliente ? cliente.nome : 'Cliente não encontrado'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                        <button onclick="editVeiculo(${veiculo.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteVeiculo(${veiculo.id})" class="text-red-600 hover:text-red-900">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        lucide.createIcons();
    }

    renderPecasTable(pecas) {
        const tbody = document.getElementById('pecas-table');
        tbody.innerHTML = pecas.map(peca => {
            const estoqueClass = peca.estoque <= (peca.estoqueMinimo || 0) ? 'estoque-baixo' : 
                               peca.estoque <= (peca.estoqueMinimo || 0) * 2 ? 'estoque-medio' : 'estoque-alto';
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Código">
                        <div class="text-sm font-medium text-gray-900">${peca.codigo}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Nome">
                        <div class="text-sm text-gray-900">${peca.nome}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Marca">
                        <div class="text-sm text-gray-500">${peca.marca || '-'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Preço">
                        <div class="text-sm text-gray-900">${Utils.formatCurrency(peca.preco)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Estoque">
                        <div class="text-sm ${estoqueClass}">${peca.estoque}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                        <button onclick="editPeca(${peca.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deletePeca(${peca.id})" class="text-red-600 hover:text-red-900">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        lucide.createIcons();
    }

    renderServicosTable(servicos) {
        const tbody = document.getElementById('servicos-table');
        tbody.innerHTML = servicos.map(servico => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap" data-label="Nome">
                    <div class="text-sm font-medium text-gray-900">${servico.nome}</div>
                </td>
                <td class="px-6 py-4" data-label="Descrição">
                    <div class="text-sm text-gray-500">${servico.descricao || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Preço">
                    <div class="text-sm text-gray-900">${Utils.formatCurrency(servico.preco)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap" data-label="Duração">
                    <div class="text-sm text-gray-500">${servico.duracaoMinutos ? `${servico.duracaoMinutos} min` : '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                    <button onclick="editServico(${servico.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>                <button onclick="deleteServico(${servico.id})" class="text-red-600 hover:text-red-900">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        lucide.createIcons();
    }

    renderOrdensTable(ordens, clientes, veiculos) {
        const tbody = document.getElementById('ordens-table');
        tbody.innerHTML = ordens.map(ordem => {
            const cliente = clientes.find(c => c.id === ordem.clienteId);
            const veiculo = veiculos.find(v => v.id === ordem.veiculoId);
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Nº Ordem">
                        <div class="text-sm font-medium text-gray-900">${ordem.numero || 'N/A'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Cliente">
                        <div class="text-sm text-gray-900">${cliente ? cliente.nome : 'Cliente não encontrado'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Veículo">
                        <div class="text-sm text-gray-500">${veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo não encontrado'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Status">
                        <span class="status-badge status-${ordem.status}">${getStatusLabel(ordem.status)}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Data">
                        <div class="text-sm text-gray-500">${Utils.formatDate(ordem.dataAbertura)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Total">
                        <div class="text-sm text-gray-900">${Utils.formatCurrency(ordem.valorTotal || 0)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Ações">
                        <button onclick="shareOrdem(${ordem.id})" class="text-blue-600 hover:text-blue-900 mr-3" title="Compartilhar">
                            <i data-lucide="share-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="editOrdem(${ordem.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>                    <button onclick="deleteOrdem(${ordem.id})" class="text-red-600 hover:text-red-900">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        lucide.createIcons();
    }
}

// Função auxiliar para cores dos status
function getStatusColor(status) {
    switch (status) {
        case 'aberta': return 'bg-blue-100 text-blue-800';
        case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
        case 'aguardando_peca': return 'bg-orange-100 text-orange-800';
        case 'concluida': return 'bg-green-100 text-green-800';
        case 'cancelada': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
 }
}

// Inicializar sistema de ordenação quando a aplicação carregar
let tableSorter;
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar ordenação após um pequeno delay para garantir que tudo esteja carregado
    setTimeout(() => {
        tableSorter = new TableSorter();

    }, 100);
});

// Função de teste para verificar filtros
function testFilterOrdens() {
    console.log('=== Teste dos Filtros de Ordens ===');
    
    const searchInput = document.getElementById('search-ordens');
    const statusFilter = document.getElementById('filter-status');
    const rows = document.querySelectorAll('#ordens-table tr');
    
    console.log('Elementos encontrados:', {
        searchInput: !!searchInput,
        statusFilter: !!statusFilter,
        totalRows: rows.length
    });
    
    if (searchInput) {
        console.log('Valor da busca:', searchInput.value);
    }
    if (statusFilter) {
        console.log('Filtro de status:', statusFilter.value);
    }
    
    // Testar cada linha
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const statusBadge = row.querySelector('.status-badge');
            let status = '';
            if (statusBadge) {
                const classes = statusBadge.className.split(' ');
                const statusClass = classes.find(cls => cls.startsWith('status-'));
                if (statusClass) {
                    status = statusClass.replace('status-', '');
                }
            }
            console.log(`Linha ${index}:`, {
                status,
                visible: row.style.display !== 'none',
                text: row.textContent.substring(0, 50) + '...'
            });
        }
    });
}

// Função para limpar todos os filtros
function clearOrdensFilters() {
    // Limpar campos de filtro
    const searchInput = document.getElementById('search-ordens');
    const statusSelect = document.getElementById('filter-status');
    
    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = '';
    
    // Aplicar filtros vazios (mostrar todas as ordens)
    applyOrdensFilters();
    
    // Feedback visual
    Utils.showToast('Filtros limpos', 'success');
}

// Função para compartilhar ordem de serviço
async function shareOrdem(id) {
    try {
        const ordem = await db.getOrdemById(id);
        if (!ordem) {
            Utils.showToast('Ordem não encontrada', 'error');
            return;
        }

        const cliente = await db.getClienteById(ordem.clienteId);
        const veiculo = await db.getVeiculoById(ordem.veiculoId);
        const allServicos = await db.getAllServicos();
        const allPecas = await db.getAllPecas();

        // Montar texto organizado da ordem de serviço
        let textoOrdem = `🔧 OFICINA MECÂNICA AMARELA\n`;
        textoOrdem += `📋 ORDEM DE SERVIÇO #${ordem.numero || ordem.id}\n`;
        textoOrdem += `${'='.repeat(40)}\n\n`;

        // Informações do cliente
        textoOrdem += `👤 CLIENTE:\n`;
        textoOrdem += `   Nome: ${cliente ? cliente.nome : 'Cliente não encontrado'}\n`;
        if (cliente && cliente.telefone) {
            textoOrdem += `   Telefone: ${cliente.telefone}\n`;
        }
        textoOrdem += `\n`;

        // Informações do veículo
        textoOrdem += `🚗 VEÍCULO:\n`;
        if (veiculo) {
            textoOrdem += `   ${veiculo.marca} ${veiculo.modelo}\n`;
            textoOrdem += `   Placa: ${veiculo.placa}\n`;
            if (veiculo.ano) {
                textoOrdem += `   Ano: ${veiculo.ano}\n`;
            }
        } else {
            textoOrdem += `   Veículo não encontrado\n`;
        }
        textoOrdem += `\n`;

        // Status e datas
        textoOrdem += `📊 STATUS: ${getStatusLabel(ordem.status).toUpperCase()}\n`;
        textoOrdem += `📅 Data de Abertura: ${Utils.formatDate(ordem.dataAbertura)}\n`;
        if (ordem.dataEntregaPrevista) {
            textoOrdem += `🎯 Entrega Prevista: ${Utils.formatDate(ordem.dataEntregaPrevista)}\n`;
        }
        if (ordem.dataConclusao) {
            textoOrdem += `✅ Data de Conclusão: ${Utils.formatDate(ordem.dataConclusao)}\n`;
        }
        textoOrdem += `\n`;

        // Descrição do problema
        if (ordem.descricaoProblema) {
            textoOrdem += `🔍 PROBLEMA RELATADO:\n`;
            textoOrdem += `${ordem.descricaoProblema}\n\n`;
        }

        // Serviços realizados
        if (ordem.servicos && ordem.servicos.length > 0) {
            textoOrdem += `🔧 SERVIÇOS REALIZADOS:\n`;
            let totalServicos = 0;
            ordem.servicos.forEach((servicoOrdem, index) => {
                const servico = allServicos.find(srv => srv.id === servicoOrdem.servicoId);
                if (servico) {
                    const subtotal = servico.preco * servicoOrdem.quantidade;
                    totalServicos += subtotal;
                    textoOrdem += `   ${index + 1}. ${servico.nome}\n`;
                    textoOrdem += `      Qtd: ${servicoOrdem.quantidade} x ${Utils.formatCurrency(servico.preco)} = ${Utils.formatCurrency(subtotal)}\n`;
                }
            });
            textoOrdem += `   Subtotal Serviços: ${Utils.formatCurrency(totalServicos)}\n\n`;
        }

        // Peças utilizadas
        if (ordem.pecas && ordem.pecas.length > 0) {
            textoOrdem += `🔩 PEÇAS UTILIZADAS:\n`;
            let totalPecas = 0;
            ordem.pecas.forEach((pecaOrdem, index) => {
                const peca = allPecas.find(p => p.id === pecaOrdem.pecaId);
                if (peca) {
                    const subtotal = peca.preco * pecaOrdem.quantidade;
                    totalPecas += subtotal;
                    textoOrdem += `   ${index + 1}. ${peca.nome}\n`;
                    textoOrdem += `      Código: ${peca.codigo}\n`;
                    textoOrdem += `      Qtd: ${pecaOrdem.quantidade} x ${Utils.formatCurrency(peca.preco)} = ${Utils.formatCurrency(subtotal)}\n`;
                }
            });
            textoOrdem += `   Subtotal Peças: ${Utils.formatCurrency(totalPecas)}\n\n`;
        }

        // Observações
        if (ordem.observacoes) {
            textoOrdem += `📝 OBSERVAÇÕES:\n`;
            textoOrdem += `${ordem.observacoes}\n\n`;
        }

        // Valor total
        textoOrdem += `${'='.repeat(40)}\n`;
        textoOrdem += `💰 VALOR TOTAL: ${Utils.formatCurrency(ordem.valorTotal || 0)}\n`;
        textoOrdem += `${'='.repeat(40)}\n\n`;
        
        textoOrdem += `📞 Oficina Mecânica Amarela\n`;
        textoOrdem += `🕒 ${new Date().toLocaleString('pt-BR')}`;

        // Usar Web Share API se disponível
        if (navigator.share) {
            await navigator.share({
                title: `Ordem de Serviço #${ordem.numero || ordem.id}`,
                text: textoOrdem
            });
            Utils.showToast('Ordem compartilhada com sucesso!', 'success');
        } else {
            // Fallback: copiar para área de transferência
            await navigator.clipboard.writeText(textoOrdem);
            Utils.showToast('Texto da ordem copiado para a área de transferência!', 'success');
        }

    } catch (error) {
        console.error('Erro ao compartilhar ordem:', error);
        Utils.showToast('Erro ao compartilhar ordem de serviço', 'error');
    }
}
