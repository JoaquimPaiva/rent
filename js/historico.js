(function() {
  'use strict';

  // ============================================================================
  // Gerenciamento do Histórico de Alugueres
  // ============================================================================

  class HistoricoApp {
    constructor() {
      this.listDiv = document.getElementById('listaAlugueres');
      this.search = document.getElementById('search');
      this.todos = [];
      this.alugueresRef = null;
      this.alugueresCallback = null;

      if (!this.listDiv || !this.search) {
        return;
      }
      
      this._waitForDependencies();
    }

    /**
     * Espera por dependências globais (auth, db, protectPage) antes de iniciar.
     * @private
     */
    _waitForDependencies() {
      const dependencies = [
        () => typeof window.auth !== 'undefined' && window.auth,
        () => typeof window.db !== 'undefined' && window.db,
        () => typeof window.protectPage === 'function'
      ];

      if (dependencies.every(check => check())) {
        this.init();
      } else {
        setTimeout(() => this._waitForDependencies(), 100);
      }
    }

    /**
     * Inicializa a aplicação após as dependências estarem prontas.
     */
    init() {
      window.protectPage();
      this._attachEventListeners();
      this._loadData();
      
      const cleanup = () => {
        try { if (this.alugueresRef && this.alugueresCallback) this.alugueresRef.off('value', this.alugueresCallback); } catch {}
      };
      window.addEventListener('beforeunload', cleanup);
      document.addEventListener('visibilitychange', () => { if (document.hidden) cleanup(); });
    }

    /**
     * Configura os event listeners para o formulário e a lista.
     * @private
     */
    _attachEventListeners() {
      this.search.addEventListener('input', () => this.filtrar());
      this.listDiv.addEventListener('click', this._handleActionClick.bind(this));
    }
    
    /**
     * Lida com o clique nos botões de ação da lista.
     * @param {Event} e - O evento de clique.
     * @private
     */
    _handleActionClick(e) {
      const target = e.target;
      const contratoId = target.dataset.view || target.dataset.edit || target.dataset.receber || target.dataset.whatsapp || target.dataset.email;
      
      if (!contratoId) return;
      
      const item = this.todos.find(c => c._id === contratoId);
      if (!item) {
        window.notifications?.error('Contrato não encontrado.');
        return;
      }
      
      if (target.dataset.view) {
        this._viewPdf(contratoId, item);
      } else if (target.dataset.edit) {
        window.location.href = `editar-aluguer.html?id=${contratoId}`;
      } else if (target.dataset.receber) {
        window.location.href = `rececao-veiculo.html?id=${contratoId}`;
      } else if (target.dataset.whatsapp) {
        this._shareOnWhatsapp(contratoId, item);
      } else if (target.dataset.email) {
        this._shareOnEmail(contratoId, item);
      } else if (target.dataset.close) {
        this._closeContrato(contratoId, item, target);
      }
    }

    // --- Funções de Gestão de Dados ---

    /**
     * Carrega os dados do Firebase e configura o ouvinte em tempo real.
     * @private
     */
    _loadData() {
      window.auth.onAuthStateChanged((user) => {
        if (!user) return;
        this.alugueresRef = window.db.ref('alugueres');
        this.alugueresCallback = (snap) => {
          const val = snap.val() || {};
          this.todos = Object.entries(val).map(([k, v]) => ({ _id: k, ...v }));
          this.filtrar();
        };
        this.alugueresRef.on('value', this.alugueresCallback);
      });
    }

    /**
     * Filtra os contratos com base no texto de pesquisa.
     */
    filtrar() {
      const q = this.search.value.toLowerCase();
      const res = this.todos.filter(item => {
        const c = item.cliente || {}; const v = item.veiculo || {}; const a = item.aluguer || {};
        return (
          (c.nome || '').toLowerCase().includes(q) ||
          (v.matricula || '').toLowerCase().includes(q) ||
          (a.inicio || '').toLowerCase().includes(q) ||
          (a.fim || '').toLowerCase().includes(q) ||
          (v.marca || '').toLowerCase().includes(q) ||
          (v.modelo || '').toLowerCase().includes(q)
        );
      });
      this.render(res);
    }

    /**
     * Renderiza a lista de contratos filtrados.
     * @param {Array<object>} items - A lista de contratos a renderizar.
     */
    render(items) {
      this.listDiv.innerHTML = '';
      if (!items.length) {
        this.listDiv.innerHTML = '<p class="muted">Sem resultados.</p>';
        return;
      }
      
      for (const item of items) {
        const div = this._createContractElement(item);
        this.listDiv.appendChild(div);
      }
    }

    /**
     * Cria um elemento DOM para um contrato.
     * @param {object} item - O objeto do contrato.
     * @returns {HTMLElement} O elemento HTML do contrato.
     * @private
     */
    _createContractElement(item) {
      const div = document.createElement('div');
      div.className = 'list-item';
      const c = item.cliente || {}; const v = item.veiculo || {}; const a = item.aluguer || {};
      const titulo = `${c.nome || '—'} • ${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
      const periodo = `${a.inicio || ''} → ${a.fim || ''}`;
      const autorLinha = item.criadoPor?.nome || item.criadoPor?.email ? `<span class="muted">Criado por: ${item.criadoPor?.nome || item.criadoPor?.email}</span>` : '';
      
      div.innerHTML = `
        <strong>${titulo}</strong>
        <span>${periodo}</span>
        ${autorLinha}
        <div style="display:flex; gap:8px; flex-wrap: wrap;">
          <button class="btn" data-view="${item._id}">Ver PDF</button>
          <button class="btn" data-edit="${item._id}">Editar</button>
          <button class="btn end" data-receber="${item._id}">Receber</button>
          <button class="btn wpp" data-whatsapp="${item._id}">Enviar WhatsApp</button>
          <button class="btn email" data-email="${item._id}">Enviar Email</button>
          <button class="btn danger" style="display:none;" data-close="${item._id}">Encerrar</button>
        </div>
      `;
      return div;
    }
    
    // --- Funções de Geração e Partilha de PDF ---

    /**
     * Gera o PDF do contrato, usando um PDF base64 se já existir.
     * @param {string} id - O ID do contrato.
     * @param {object} payload - Os dados do contrato.
     * @returns {Promise<string>} Uma promessa com a Data URL do PDF.
     * @private
     */
    async _getPdfForShare(id, payload) {
      try {
        if (typeof window.gerarContratoPDF !== 'function') {
          throw new Error('Função gerarContratoPDF não está disponível');
        }
        
        // Se já tivermos o PDF em base64, usamos esse
        if (payload.pdfBase64) {
          if (payload.pdfBase64.startsWith('data:')) {
            return payload.pdfBase64;
          }
          return `data:application/pdf;base64,${payload.pdfBase64}`;
        }
        
        return await window.gerarContratoPDF({ id, ...payload });
      } catch (e) {
        throw e;
      }
    }
    
    /**
     * Abre um overlay para visualizar o PDF do contrato.
     * @param {string} url - A URL do PDF.
     * @private
     */
    _showPdfOverlay(url) {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:2rem;';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;background:#fff;width:90%;height:90%;box-shadow:0 10px 30px rgba(0,0,0,.3);border-radius:8px;overflow:hidden;';
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.setAttribute('aria-label','Fechar');
      closeBtn.style.cssText = 'position:absolute;top:8px;right:8px;border:none;background:#222;color:#fff;border-radius:4px;padding:6px 10px;cursor:pointer;z-index:2;';
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.cssText = 'width:100%;height:100%;border:0;';
      closeBtn.onclick = () => overlay.remove();
      wrap.appendChild(closeBtn);
      wrap.appendChild(iframe);
      overlay.appendChild(wrap);
      document.body.appendChild(overlay);
    }
    
    /**
     * Visualiza o PDF do contrato.
     * @param {string} id - O ID do contrato.
     * @param {object} item - Os dados do contrato.
     * @private
     */
    async _viewPdf(id, item) {
      try {
        const dataUri = await this._getPdfForShare(id, item);
        const blob = window.pdfUtils?.dataUriToBlob(dataUri);
        const url = URL.createObjectURL(blob);
        
        const popup = window.open('about:blank', '_blank');
        if (popup) {
          popup.location.href = url;
          setTimeout(() => URL.revokeObjectURL(url), 30000);
        } else {
          this._showPdfOverlay(url);
        }
      } catch (e) {
        window.notifications?.error(e.message || 'Não foi possível gerar/abrir o PDF.');
      }
    }

    /**
     * Partilha o PDF no WhatsApp.
     * @param {string} id - O ID do contrato.
     * @param {object} item - Os dados do contrato.
     * @private
     */
    async _shareOnWhatsapp(id, item) {
      try {
        const dataUri = await this._getPdfForShare(id, item);
        const aEl = document.createElement('a'); aEl.href = dataUri; aEl.download = `contrato-${id}.pdf`; aEl.click();
        const nome = (item.cliente?.nome || 'Cliente');
        const tel = (item.cliente?.contacto || '').replace(/\D+/g, '');
        const msg = encodeURIComponent(`Olá ${nome}, segue o contrato em PDF em anexo.`);
        const href = tel ? `https://wa.me/${tel}?text=${msg}` : `https://wa.me/?text=${msg}`;
        window.open(href, '_blank');
      } catch (e) {
        window.notifications?.error(`Erro ao preparar WhatsApp: ${e.message || 'Não foi possível preparar o link do PDF.'}`);
      }
    }

    /**
     * Partilha o PDF por email.
     * @param {string} id - O ID do contrato.
     * @param {object} item - Os dados do contrato.
     * @private
     */
    async _shareOnEmail(id, item) {
      try {
        const dataUri = await this._getPdfForShare(id, item);
        const to = item.cliente?.email || '';
        const subject = encodeURIComponent('Contrato de Aluguer');
        const body = encodeURIComponent('Olá,\n\nSegue o contrato em PDF em anexo. (Se não aparecer anexado automaticamente, foi iniciado o download para o poderes anexar manualmente.)\n\nCumprimentos.');
        const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
        const aEl = document.createElement('a'); aEl.href = dataUri; aEl.download = `contrato-${id}.pdf`; aEl.click();
        window.location.href = mailto;
      } catch (e) {
        window.notifications?.error(`Erro ao preparar email: ${e.message || 'Não foi possível preparar o envio por email.'}`);
      }
    }

    /**
     * Move um contrato para a lista de "terminados".
     * @param {string} id - O ID do contrato.
     * @param {object} item - Os dados do contrato.
     * @param {HTMLElement} btn - O botão de encerramento.
     * @private
     */
    async _closeContrato(id, item, btn) {
      const confirmar = confirm('Tens a certeza que pretendes fechar este contrato?');
      if (!confirmar) return;
      try {
        btn.disabled = true;
        const copia = { ...item };
        delete copia._id;
        
        const user = window.auth?.currentUser || null;
        const userMeta = { uid: user?.uid || null, email: user?.email || null, nome: (user?.displayName || user?.email || '—') };
        
        const aluguer = {
          ...(copia.aluguer || {}),
          estado: 'terminado',
          terminadoEm: new Date().toISOString()
        };

        const updates = {
          [`alugueres_terminados/${id}`]: {
            ...copia,
            aluguer,
            encerradoPor: userMeta,
            encerradoEm: new Date().toISOString()
          },
          [`alugueres/${id}`]: null
        };
        
        await window.db.ref().update(updates);
        window.notifications?.success('Contrato fechado e movido para "contratos terminados".');
      } catch (e) {
        window.notifications?.error('Não foi possível fechar o contrato agora.');
      } finally {
        btn.disabled = false;
      }
    }
  }

  // Inicializa a aplicação quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new HistoricoApp());
  } else {
    new HistoricoApp();
  }
})();