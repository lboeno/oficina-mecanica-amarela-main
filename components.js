// Componentes e utilitários da aplicação

// Utilitários
const Utils = {
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('pt-BR');
    },

    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('pt-BR');
    },validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    maskPhone(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
            .replace(/(-\d{4})\d+?$/, '$1');
    },    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-x-full ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' : 
            type === 'info' ? 'bg-blue-500' : 'bg-blue-500'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
};

// Componente de Modal Base
class Modal {
    constructor(title, content, size = 'md') {
        this.title = title;
        this.content = content;
        this.size = size;
        this.overlay = null;
    }

    show() {
        const sizeClasses = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl'
        };

        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4';
        
        this.overlay.innerHTML = `
            <div class="modal-content bg-white rounded-lg shadow-xl w-full ${sizeClasses[this.size]}">
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">${this.title}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <div class="p-6">
                    ${this.content}
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);
        lucide.createIcons();

        // Fechar modal ao clicar no overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', this.handleEscape.bind(this));
    }

    close() {
        if (this.overlay) {
            document.removeEventListener('keydown', this.handleEscape.bind(this));
            this.overlay.remove();
        }
    }

    handleEscape(e) {
        if (e.key === 'Escape') {
            this.close();
        }
    }
}

// Modais específicos
function openClienteModal(cliente = null) {
    const isEdit = cliente !== null;
    const title = isEdit ? 'Editar Cliente' : 'Novo Cliente';
    
    const content = `
        <form id="cliente-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input type="text" id="cliente-nome" value="${isEdit ? cliente.nome : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input type="email" id="cliente-email" value="${isEdit ? cliente.email : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                    <input type="tel" id="cliente-telefone" value="${isEdit ? cliente.telefone : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                <textarea id="cliente-endereco" rows="3" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">${isEdit ? cliente.endereco || '' : ''}</textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    ${isEdit ? 'Atualizar' : 'Salvar'}
                </button>
            </div>
        </form>
    `;

    const modal = new Modal(title, content);
    modal.show();    // Aplicar máscaras
    const telefoneInput = document.getElementById('cliente-telefone');
    
    telefoneInput.addEventListener('input', (e) => {
        e.target.value = Utils.maskPhone(e.target.value);
    });

    // Handle form submission
    document.getElementById('cliente-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCliente(isEdit ? cliente.id : null);
        modal.close();
    });
}

function openVeiculoModal(veiculo = null) {
    const isEdit = veiculo !== null;
    const title = isEdit ? 'Editar Veículo' : 'Novo Veículo';
    
    const content = `
        <form id="veiculo-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Placa *</label>
                    <input type="text" id="veiculo-placa" value="${isEdit ? veiculo.placa : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                    <select id="veiculo-cliente" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                        <option value="">Selecione um cliente</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Marca *</label>
                    <input type="text" id="veiculo-marca" value="${isEdit ? veiculo.marca : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Modelo *</label>
                    <input type="text" id="veiculo-modelo" value="${isEdit ? veiculo.modelo : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Ano *</label>
                    <input type="number" id="veiculo-ano" value="${isEdit ? veiculo.ano : ''}" min="1900" max="2030"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                    <input type="text" id="veiculo-cor" value="${isEdit ? veiculo.cor || '' : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea id="veiculo-observacoes" rows="3" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">${isEdit ? veiculo.observacoes || '' : ''}</textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    ${isEdit ? 'Atualizar' : 'Salvar'}
                </button>
            </div>
        </form>
    `;

    const modal = new Modal(title, content);
    modal.show();

    // Carregar clientes
    loadClientesSelect(isEdit ? veiculo.clienteId : null);

    // Handle form submission
    document.getElementById('veiculo-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveVeiculo(isEdit ? veiculo.id : null);
        modal.close();
    });
}

function openPecaModal(peca = null) {
    const isEdit = peca !== null;
    const title = isEdit ? 'Editar Peça' : 'Nova Peça';
    
    const content = `
        <form id="peca-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Código *</label>
                    <input type="text" id="peca-codigo" value="${isEdit ? peca.codigo : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input type="text" id="peca-nome" value="${isEdit ? peca.nome : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                    <input type="text" id="peca-marca" value="${isEdit ? peca.marca || '' : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Preço *</label>
                    <input type="number" id="peca-preco" value="${isEdit ? peca.preco : ''}" step="0.01" min="0"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Estoque *</label>
                    <input type="number" id="peca-estoque" value="${isEdit ? peca.estoque : '0'}" min="0"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Estoque Mínimo</label>
                    <input type="number" id="peca-estoque-minimo" value="${isEdit ? peca.estoqueMinimo || '0' : '0'}" min="0"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea id="peca-descricao" rows="3" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">${isEdit ? peca.descricao || '' : ''}</textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    ${isEdit ? 'Atualizar' : 'Salvar'}
                </button>
            </div>
        </form>
    `;

    const modal = new Modal(title, content);
    modal.show();

    // Handle form submission
    document.getElementById('peca-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePeca(isEdit ? peca.id : null);
        modal.close();
    });
}

function openServicoModal(servico = null) {
    const isEdit = servico !== null;
    const title = isEdit ? 'Editar Serviço' : 'Novo Serviço';
    
    const content = `
        <form id="servico-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input type="text" id="servico-nome" value="${isEdit ? servico.nome : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Preço *</label>
                    <input type="number" id="servico-preco" value="${isEdit ? servico.preco : ''}" step="0.01" min="0"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Duração Estimada (minutos)</label>
                <input type="number" id="servico-duracao" value="${isEdit ? servico.duracaoMinutos || '' : ''}" min="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                <textarea id="servico-descricao" rows="4" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>${isEdit ? servico.descricao || '' : ''}</textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    ${isEdit ? 'Atualizar' : 'Salvar'}
                </button>
            </div>
        </form>
    `;

    const modal = new Modal(title, content);
    modal.show();

    // Handle form submission
    document.getElementById('servico-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveServico(isEdit ? servico.id : null);
        modal.close();
    });
}

async function openOrdemModal(ordem = null) {
    const isEdit = ordem !== null;
    const title = isEdit ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço';
    
    const content = `
        <form id="ordem-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                    <select id="ordem-cliente" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                        <option value="">Selecione um cliente</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Veículo *</label>
                    <select id="ordem-veiculo" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                        <option value="">Selecione um veículo</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select id="ordem-status" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                        <option value="aberta" ${isEdit && ordem.status === 'aberta' ? 'selected' : ''}>Aberta</option>
                        <option value="em_andamento" ${isEdit && ordem.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
                        <option value="concluida" ${isEdit && ordem.status === 'concluida' ? 'selected' : ''}>Concluída</option>
                        <option value="cancelada" ${isEdit && ordem.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Data de Entrega Prevista</label>
                    <input type="date" id="ordem-data-entrega" value="${isEdit && ordem.dataEntregaPrevista ? ordem.dataEntregaPrevista.split('T')[0] : ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Descrição do Problema *</label>
                <textarea id="ordem-descricao" rows="3" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>${isEdit ? ordem.descricaoProblema || '' : ''}</textarea>
            </div>
            
            <!-- Serviços -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Serviços</label>
                <div id="servicos-container" class="space-y-2">
                    <!-- Serviços serão adicionados dinamicamente -->
                </div>
                <button type="button" onclick="addServicoToOrdem()" 
                        class="mt-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    + Adicionar Serviço
                </button>
            </div>
            
            <!-- Peças -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Peças</label>
                <div id="pecas-container" class="space-y-2">
                    <!-- Peças serão adicionadas dinamicamente -->
                </div>
                <button type="button" onclick="addPecaToOrdem()" 
                        class="mt-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                    + Adicionar Peça
                </button>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea id="ordem-observacoes" rows="3" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">${isEdit ? ordem.observacoes || '' : ''}</textarea>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between text-lg font-semibold">
                    <span>Valor Total:</span>
                    <span id="ordem-valor-total">R$ 0,00</span>
                </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    ${isEdit ? 'Atualizar' : 'Salvar'}
                </button>
            </div>
        </form>
    `;    const modal = new Modal(title, content, 'xl');
    modal.show();

    // Carregar dados iniciais na ordem correta
    await loadClientesSelect(isEdit ? ordem.clienteId : null);
    
    // Se estiver editando, carregar os dados da ordem
    if (isEdit && ordem) {
        await loadOrdemData(ordem);
    }

    // Handle form submission
    document.getElementById('ordem-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveOrdem(isEdit ? ordem.id : null);
        modal.close();
    });
}

// Funções auxiliares para carregar dados nos selects
async function loadClientesSelect(selectedClienteId = null) {
    const select = document.getElementById('veiculo-cliente') || document.getElementById('ordem-cliente');
    if (!select) return;
    
    const clientes = await db.getAllClientes();
    
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        if (selectedClienteId && cliente.id === selectedClienteId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Se for modal de ordem, adicionar event listener para carregar veículos quando cliente for selecionado
    if (select.id === 'ordem-cliente') {
        select.addEventListener('change', loadVeiculosByCliente);
        // Não carregar veículos automaticamente aqui, será feito pela loadOrdemData se necessário
    }
}

async function loadVeiculosByCliente(selectedVeiculoId = null) {
    const clienteSelect = document.getElementById('ordem-cliente');
    const veiculoSelect = document.getElementById('ordem-veiculo');
    
    if (!clienteSelect || !veiculoSelect) return;
    
    veiculoSelect.innerHTML = '<option value="">Selecione um veículo</option>';
    
    if (clienteSelect.value) {
        try {
            const veiculos = await db.getVeiculosByCliente(parseInt(clienteSelect.value));
            veiculos.forEach(veiculo => {
                const option = document.createElement('option');
                option.value = veiculo.id;
                option.textContent = `${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}`;
                if (selectedVeiculoId && veiculo.id === selectedVeiculoId) {
                    option.selected = true;
                }
                veiculoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar veículos:', error);
            Utils.showToast('Erro ao carregar veículos do cliente', 'error');
        }
    }
}

// Funções para gerenciar serviços e peças na ordem
let servicosOrdem = [];
let pecasOrdem = [];

async function addServicoToOrdem() {
    const servicos = await db.getAllServicos();
    
    const container = document.getElementById('servicos-container');
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-2 p-2 bg-gray-50 rounded';
    
    div.innerHTML = `
        <select class="flex-1 px-2 py-1 border rounded servico-select">
            <option value="">Selecione um serviço</option>
            ${servicos.map(s => `<option value="${s.id}" data-preco="${s.preco}">${s.nome} - ${Utils.formatCurrency(s.preco)}</option>`).join('')}
        </select>
        <input type="number" min="1" value="1" class="w-20 px-2 py-1 border rounded quantidade-servico" placeholder="Qtd">
        <button type="button" onclick="this.parentElement.remove(); updateOrdemTotal()" 
                class="text-red-600 hover:text-red-800">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    `;
    
    container.appendChild(div);
    lucide.createIcons();
    
    // Adicionar event listeners
    div.querySelector('.servico-select').addEventListener('change', updateOrdemTotal);
    div.querySelector('.quantidade-servico').addEventListener('input', updateOrdemTotal);
}

async function addPecaToOrdem() {
    const pecas = await db.getAllPecas();
    
    const container = document.getElementById('pecas-container');
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-2 p-2 bg-gray-50 rounded';
    
    div.innerHTML = `
        <select class="flex-1 px-2 py-1 border rounded peca-select">
            <option value="">Selecione uma peça</option>
            ${pecas.map(p => `<option value="${p.id}" data-preco="${p.preco}" data-estoque="${p.estoque}">${p.nome} - ${Utils.formatCurrency(p.preco)} (Est: ${p.estoque})</option>`).join('')}
        </select>
        <input type="number" min="1" value="1" class="w-20 px-2 py-1 border rounded quantidade-peca" placeholder="Qtd">
        <button type="button" onclick="this.parentElement.remove(); updateOrdemTotal()" 
                class="text-red-600 hover:text-red-800">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    `;
    
    container.appendChild(div);
    lucide.createIcons();
      // Adicionar event listeners
    div.querySelector('.peca-select').addEventListener('change', updateOrdemTotal);
    div.querySelector('.quantidade-peca').addEventListener('input', (e) => {
        const select = e.target.parentElement.querySelector('.peca-select');
        const quantidade = parseInt(e.target.value) || 1;
        
        if (select.value) {
            const estoque = parseInt(select.options[select.selectedIndex].dataset.estoque);
            if (quantidade > estoque) {
                Utils.showToast(`Quantidade solicitada (${quantidade}) excede o estoque disponível (${estoque})`, 'warning');
                e.target.value = estoque;
            }
        }
        updateOrdemTotal();
    });
    
    div.querySelector('.peca-select').addEventListener('change', (e) => {
        const quantidade = parseInt(e.target.parentElement.querySelector('.quantidade-peca').value) || 1;
        if (e.target.value) {
            const estoque = parseInt(e.target.options[e.target.selectedIndex].dataset.estoque);
            if (quantidade > estoque) {
                e.target.parentElement.querySelector('.quantidade-peca').value = estoque;
                Utils.showToast(`Quantidade ajustada para o estoque disponível (${estoque})`, 'warning');
            }
        }
        updateOrdemTotal();
    });
}

function updateOrdemTotal() {
    let total = 0;
    
    // Somar serviços
    document.querySelectorAll('.servico-select').forEach(select => {
        if (select.value) {
            const preco = parseFloat(select.options[select.selectedIndex].dataset.preco);
            const quantidade = parseInt(select.parentElement.querySelector('.quantidade-servico').value) || 1;
            total += preco * quantidade;
        }
    });
    
    // Somar peças
    document.querySelectorAll('.peca-select').forEach(select => {
        if (select.value) {
            const preco = parseFloat(select.options[select.selectedIndex].dataset.preco);
            const quantidade = parseInt(select.parentElement.querySelector('.quantidade-peca').value) || 1;
            total += preco * quantidade;
        }
    });
    
    document.getElementById('ordem-valor-total').textContent = Utils.formatCurrency(total);
}

async function loadOrdemData(ordem) {
    if (!ordem) return;
    
    // Primeiro, carregar os veículos do cliente e selecionar o veículo correto
    if (ordem.clienteId && ordem.veiculoId) {
        await loadVeiculosByCliente(ordem.veiculoId);
    }
    
    // Carregar serviços
    if (ordem.servicos) {
        for (const servico of ordem.servicos) {
            await addServicoToOrdem();
            const lastServicoDiv = document.getElementById('servicos-container').lastElementChild;
            lastServicoDiv.querySelector('.servico-select').value = servico.servicoId;
            lastServicoDiv.querySelector('.quantidade-servico').value = servico.quantidade;
        }
    }
    
    // Carregar peças
    if (ordem.pecas) {
        for (const peca of ordem.pecas) {
            await addPecaToOrdem();
            const lastPecaDiv = document.getElementById('pecas-container').lastElementChild;
            lastPecaDiv.querySelector('.peca-select').value = peca.pecaId;
            lastPecaDiv.querySelector('.quantidade-peca').value = peca.quantidade;
        }
    }
    
    updateOrdemTotal();
}

function openImportModal() {
    const content = `
        <form id="import-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Selecione o arquivo de backup (JSON)</label>
                <input type="file" id="backup-file" accept=".json" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required>
                <p class="text-sm text-gray-500 mt-1">Formato aceito: arquivo JSON com dados de backup</p>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex">
                    <i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-400 mr-2"></i>
                    <div>
                        <h4 class="text-sm font-medium text-yellow-800">Atenção!</h4>
                        <p class="text-sm text-yellow-700">Esta operação irá substituir todos os dados existentes. Faça um backup antes de continuar.</p>
                    </div>
                </div>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Importar Backup
                </button>
            </div>
        </form>
    `;

    const modal = new Modal('Importar Backup', content);
    modal.show();

    // Handle form submission
    document.getElementById('import-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('backup-file');
        const file = fileInput.files[0];
        
        if (!file) {
            Utils.showToast('Selecione um arquivo de backup', 'error');
            return;
        }

        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            
            await importBackup(backupData);
            modal.close();
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            Utils.showToast('Erro ao importar backup: ' + error.message, 'error');
        }
    });
}

function confirmClearDatabase() {
    const content = `
        <div class="space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                    <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 mr-2"></i>
                    <div>
                        <h4 class="text-sm font-medium text-red-800">Confirmação de Exclusão</h4>
                        <p class="text-sm text-red-700">Esta operação irá excluir TODOS os dados do sistema permanentemente. Esta ação não pode ser desfeita.</p>
                    </div>
                </div>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 class="font-medium text-gray-900 mb-2">Dados que serão excluídos:</h5>
                <ul class="text-sm text-gray-700 space-y-1">
                    <li>• Todos os clientes cadastrados</li>
                    <li>• Todos os veículos registrados</li>
                    <li>• Todas as peças do estoque</li>
                    <li>• Todos os serviços disponíveis</li>
                    <li>• Todas as ordens de serviço</li>
                </ul>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="button" onclick="clearDatabase()" 
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Sim, Excluir Tudo
                </button>
            </div>
        </div>
    `;

    const modal = new Modal('Limpar Banco de Dados', content);
    modal.show();
}

function confirmLoadDemoData() {
    const content = `
        <div class="space-y-4">
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div class="flex">
                    <i data-lucide="database" class="w-5 h-5 text-purple-400 mr-2"></i>
                    <div>
                        <h4 class="text-sm font-medium text-purple-800">Carregar Dados de Demonstração</h4>
                        <p class="text-sm text-purple-700">Esta operação irá adicionar dados de exemplo ao sistema para demonstração e testes.</p>
                    </div>
                </div>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 class="font-medium text-gray-900 mb-2">Dados que serão adicionados:</h5>
                <ul class="text-sm text-gray-700 space-y-1">
                    <li>• 5 clientes de exemplo</li>
                    <li>• 8 veículos variados</li>
                    <li>• 15 peças de estoque</li>
                    <li>• 10 serviços disponíveis</li>
                    <li>• 6 ordens de serviço em diferentes status</li>
                </ul>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex">
                    <i data-lucide="info" class="w-5 h-5 text-yellow-400 mr-2"></i>
                    <div>
                        <p class="text-sm text-yellow-700">Os dados serão adicionados aos existentes. Para um sistema limpo, use "Limpar Banco" antes de carregar os dados de demonstração.</p>
                    </div>
                </div>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button type="button" onclick="loadDemoData()" 
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Carregar Dados
                </button>
            </div>
        </div>
    `;

    const modal = new Modal('Dados de Demonstração', content);
    modal.show();
}
