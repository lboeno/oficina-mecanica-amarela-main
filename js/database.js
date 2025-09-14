// Gerenciamento do banco de dados IndexedDB
class DatabaseManager {
    constructor() {
        this.dbName = 'OficinaDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Erro ao abrir o banco de dados'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                
                // Verificar se todas as stores necessárias existem
                const requiredStores = ['clientes', 'veiculos', 'pecas', 'servicos', 'ordens'];
                const existingStores = Array.from(this.db.objectStoreNames);
                const missingStores = requiredStores.filter(store => !existingStores.includes(store));
                
                if (missingStores.length > 0) {
                    console.warn('Stores faltando:', missingStores);
                    // Fechar e reabrir com versão incrementada para forçar upgrade
                    this.db.close();
                    this.dbVersion++;
                    this.init().then(resolve).catch(reject);
                    return;
                }
                
                console.log('Banco de dados pronto com stores:', existingStores);
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Atualizando estrutura do banco de dados...');                // Store para clientes
                if (!db.objectStoreNames.contains('clientes')) {
                    const clientesStore = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
                    clientesStore.createIndex('nome', 'nome', { unique: false });
                    clientesStore.createIndex('email', 'email', { unique: true });
                    clientesStore.createIndex('telefone', 'telefone', { unique: false });
                    console.log('Store clientes criada');
                }

                // Store para veículos
                if (!db.objectStoreNames.contains('veiculos')) {
                    const veiculosStore = db.createObjectStore('veiculos', { keyPath: 'id', autoIncrement: true });
                    veiculosStore.createIndex('placa', 'placa', { unique: true });
                    veiculosStore.createIndex('clienteId', 'clienteId', { unique: false });
                    veiculosStore.createIndex('marca', 'marca', { unique: false });
                    veiculosStore.createIndex('modelo', 'modelo', { unique: false });
                    console.log('Store veiculos criada');
                }

                // Store para peças
                if (!db.objectStoreNames.contains('pecas')) {
                    const pecasStore = db.createObjectStore('pecas', { keyPath: 'id', autoIncrement: true });
                    pecasStore.createIndex('codigo', 'codigo', { unique: true });
                    pecasStore.createIndex('nome', 'nome', { unique: false });
                    pecasStore.createIndex('marca', 'marca', { unique: false });
                    console.log('Store pecas criada');
                }

                // Store para serviços
                if (!db.objectStoreNames.contains('servicos')) {
                    const servicosStore = db.createObjectStore('servicos', { keyPath: 'id', autoIncrement: true });
                    servicosStore.createIndex('nome', 'nome', { unique: false });
                    console.log('Store servicos criada');
                }

                // Store para ordens de serviço
                if (!db.objectStoreNames.contains('ordens')) {
                    const ordensStore = db.createObjectStore('ordens', { keyPath: 'id', autoIncrement: true });
                    ordensStore.createIndex('numero', 'numero', { unique: true });
                    ordensStore.createIndex('clienteId', 'clienteId', { unique: false });
                    ordensStore.createIndex('veiculoId', 'veiculoId', { unique: false });
                    ordensStore.createIndex('status', 'status', { unique: false });
                    ordensStore.createIndex('dataAbertura', 'dataAbertura', { unique: false });
                    console.log('Store ordens criada');
                }
            };
        });
    }

    // Métodos genéricos para CRUD
    async add(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async search(storeName, indexName, value) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async count(storeName) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Métodos específicos para cada entidade
    
    // Clientes
    async addCliente(cliente) {
        cliente.dataCriacao = new Date().toISOString();
        return await this.add('clientes', cliente);
    }

    async updateCliente(cliente) {
        cliente.dataModificacao = new Date().toISOString();
        return await this.update('clientes', cliente);
    }

    async deleteCliente(id) {
        return await this.delete('clientes', id);
    }

    async getClienteById(id) {
        return await this.get('clientes', id);
    }

    async getAllClientes() {
        return await this.getAll('clientes');
    }    async getClienteByEmail(email) {
        const result = await this.search('clientes', 'email', email);
        return result[0] || null;
    }

    // Veículos
    async addVeiculo(veiculo) {
        veiculo.dataCriacao = new Date().toISOString();
        return await this.add('veiculos', veiculo);
    }

    async updateVeiculo(veiculo) {
        veiculo.dataModificacao = new Date().toISOString();
        return await this.update('veiculos', veiculo);
    }

    async deleteVeiculo(id) {
        return await this.delete('veiculos', id);
    }

    async getVeiculoById(id) {
        return await this.get('veiculos', id);
    }

    async getAllVeiculos() {
        return await this.getAll('veiculos');
    }

    async getVeiculosByCliente(clienteId) {
        return await this.search('veiculos', 'clienteId', clienteId);
    }

    async getVeiculoByPlaca(placa) {
        const result = await this.search('veiculos', 'placa', placa);
        return result[0] || null;
    }

    // Peças
    async addPeca(peca) {
        peca.dataCriacao = new Date().toISOString();
        return await this.add('pecas', peca);
    }

    async updatePeca(peca) {
        peca.dataModificacao = new Date().toISOString();
        return await this.update('pecas', peca);
    }

    async deletePeca(id) {
        return await this.delete('pecas', id);
    }

    async getPecaById(id) {
        return await this.get('pecas', id);
    }

    async getAllPecas() {
        return await this.getAll('pecas');
    }

    async getPecaByCodigo(codigo) {
        const result = await this.search('pecas', 'codigo', codigo);
        return result[0] || null;
    }

    // Serviços
    async addServico(servico) {
        servico.dataCriacao = new Date().toISOString();
        return await this.add('servicos', servico);
    }

    async updateServico(servico) {
        servico.dataModificacao = new Date().toISOString();
        return await this.update('servicos', servico);
    }

    async deleteServico(id) {
        return await this.delete('servicos', id);
    }

    async getServicoById(id) {
        return await this.get('servicos', id);
    }

    async getAllServicos() {
        return await this.getAll('servicos');
    }    // Ordens de Serviço
    async addOrdem(ordem) {
        ordem.dataAbertura = ordem.dataAbertura || new Date().toISOString();
        ordem.numero = ordem.numero || await this.generateNumeroOrdem();
        ordem.status = ordem.status || 'aberta';
        return await this.add('ordens', ordem);
    }async updateOrdem(ordem) {
        // Preservar dados originais importantes
        const ordemExistente = await this.getOrdemById(ordem.id);
        if (ordemExistente) {
            // Preservar data de abertura original
            ordem.dataAbertura = ordemExistente.dataAbertura || ordem.dataAbertura;
            // Preservar número da ordem original
            ordem.numero = ordemExistente.numero || ordem.numero;
            
            // Se não há número na ordem existente nem na nova, gerar um
            if (!ordem.numero) {
                ordem.numero = await this.generateNumeroOrdem();
            }
        }
        ordem.dataModificacao = new Date().toISOString();
        return await this.update('ordens', ordem);
    }

    async deleteOrdem(id) {
        return await this.delete('ordens', id);
    }

    async getOrdemById(id) {
        return await this.get('ordens', id);
    }

    async getAllOrdens() {
        return await this.getAll('ordens');
    }

    async getOrdensByCliente(clienteId) {
        return await this.search('ordens', 'clienteId', clienteId);
    }

    async getOrdensByStatus(status) {
        return await this.search('ordens', 'status', status);
    }    async generateNumeroOrdem() {
        const now = new Date();
        const year = now.getFullYear();
        const count = await this.count('ordens');
        return `OS-${year}-${String(count + 1).padStart(3, '0')}`;
    }// Estatísticas
    async getDashboardStats() {
        try {
            console.log('Obtendo estatísticas do dashboard...');
            
            // Verificar se todas as stores existem
            const requiredStores = ['clientes', 'veiculos', 'pecas', 'servicos', 'ordens'];
            for (const store of requiredStores) {
                if (!this.db.objectStoreNames.contains(store)) {
                    console.warn(`Store ${store} não encontrada`);
                    return this.getEmptyStats();
                }
            }
            
            const totalClientes = await this.count('clientes');
            const totalVeiculos = await this.count('veiculos');
            const totalPecas = await this.count('pecas');
            const totalServicos = await this.count('servicos');
            
            // Contar ordens abertas de forma segura
            let ordensAbertas = 0;
            try {
                const ordensAbertasArray = await this.getOrdensByStatus('aberta');
                const ordensAndamentoArray = await this.getOrdensByStatus('em_andamento');
                ordensAbertas = ordensAbertasArray.length + ordensAndamentoArray.length;
            } catch (error) {
                console.warn('Erro ao contar ordens abertas:', error);
                ordensAbertas = 0;
            }
            
            const ordensRecentes = await this.getOrdensRecentes(5);
            const estatisticasMes = await this.getEstatisticasMes();
            
            console.log('Estatísticas obtidas com sucesso');
            return {
                totalClientes,
                totalVeiculos,
                totalPecas,
                totalServicos,
                ordensAbertas,
                ordensRecentes,
                estatisticasMes
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return this.getEmptyStats();
        }
    }
      getEmptyStats() {
        return {
            totalClientes: 0,
            totalVeiculos: 0,
            totalPecas: 0,
            totalServicos: 0,
            ordensAbertas: 0,
            ordensRecentes: [],
            estatisticasMes: { receitaTotal: 0, servicosConcluidos: 0, pecasUtilizadas: 0 }
        };
    }

    async getOrdensRecentes(limit = 5) {
        const ordens = await this.getAll('ordens');
        return ordens
            .sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura))
            .slice(0, limit);
    }    async getEstatisticasMes() {
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

        const ordens = await this.getAll('ordens');
        const ordensDoMes = ordens.filter(ordem => {
            const dataOrdem = new Date(ordem.dataAbertura);
            return dataOrdem >= inicioMes && dataOrdem <= fimMes;
        });

        const ordensConcluidas = ordensDoMes.filter(ordem => ordem.status === 'concluida');
        
        const receitaTotal = ordensConcluidas
            .reduce((total, ordem) => total + (ordem.valorTotal || 0), 0);

        const servicosConcluidos = ordensConcluidas.length;

        // Calcular total de peças utilizadas nas ordens concluídas do mês
        let pecasUtilizadas = 0;
        ordensConcluidas.forEach(ordem => {
            if (ordem.pecas && Array.isArray(ordem.pecas)) {
                pecasUtilizadas += ordem.pecas.reduce((total, peca) => total + (peca.quantidade || 0), 0);
            }
        });

        return {
            receitaTotal: receitaTotal,
            servicosConcluidos: servicosConcluidos,
            pecasUtilizadas: pecasUtilizadas
        };
    }

    // Método para verificar peças com estoque baixo
    async updateEstoquePeca(pecaId, novaQuantidade) {
        const peca = await this.getPecaById(pecaId);
        if (peca) {
            peca.estoque = novaQuantidade;
            return await this.updatePeca(peca);
        }
        return null;
    }

    async getPecasEstoqueBaixo() {
        const pecas = await this.getAllPecas();
        return pecas.filter(peca => peca.estoque <= (peca.estoqueMinimo || 0));
    }

    // Métodos de backup e restauração
    async exportAllData() {
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                clientes: await this.getAll('clientes'),
                veiculos: await this.getAll('veiculos'),
                pecas: await this.getAll('pecas'),
                servicos: await this.getAll('servicos'),
                ordens: await this.getAll('ordens')
            }
        };
        return data;
    }

    async importAllData(backupData) {
        if (!backupData || !backupData.data) {
            throw new Error('Formato de backup inválido');
        }

        const stores = ['clientes', 'veiculos', 'pecas', 'servicos', 'ordens'];
        
        // Limpar dados existentes
        for (const store of stores) {
            await this.clearStore(store);
        }

        // Importar novos dados
        for (const store of stores) {
            if (backupData.data[store] && Array.isArray(backupData.data[store])) {
                for (const item of backupData.data[store]) {
                    // Remove o ID para que o IndexedDB gere um novo
                    const itemCopy = { ...item };
                    delete itemCopy.id;
                    await this.add(store, itemCopy);
                }
            }
        }
    }

    async clearStore(storeName) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllData() {
        const stores = ['clientes', 'veiculos', 'pecas', 'servicos', 'ordens'];
        
        for (const store of stores) {
            await this.clearStore(store);
        }
    }
}

// Instância global do gerenciador de banco de dados
const db = new DatabaseManager();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

app.use(cors());
app.use(express.json());

// Conexão com o banco fatec_pj
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // troque para seu usuário do MySQL
  password: '',    // troque para sua senha do MySQL
  database: 'fatec_pj'
});

// Exemplo: listar clientes
app.get('/api/clientes', (req, res) => {
  connection.query('SELECT * FROM clientes', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(3000, () => console.log('API rodando na porta 3000'));
