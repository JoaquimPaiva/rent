(function initInputsGuards() {
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  const setFormatted = (input, formatter) => {
    if (!input || !formatter) return;
    
    try {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const old = input.value;
      const formatted = formatter(old, input);
      
      if (formatted !== old) {
        input.value = formatted;
        // tentativa simples de manter o cursor no fim
        try { 
          input.setSelectionRange(formatted.length, formatted.length); 
        } catch (error) {
          console.warn('Erro ao definir posição do cursor:', error);
        }
      }
    } catch (error) {
      console.warn('Erro ao formatar input:', error);
    }
  };

  // NIF: 9 dígitos, mostrar como XXX XXX XXX
  const formatNif = (val) => {
    if (!val || typeof val !== 'string') return '';
    
    try {
      const digits = val.replace(/\D+/g, '').slice(0, 9);
      return digits.replace(/(\d{3})(\d{0,3})(\d{0,3}).*/, (m, a, b, c) => [a, b, c].filter(Boolean).join(' '));
    } catch (error) {
      console.warn('Erro ao formatar NIF:', error);
      return val || '';
    }
  };

  // Telefone PT: 9 dígitos, mostrar XXX XXX XXX
  const formatPhone = (val) => {
    if (!val || typeof val !== 'string') return '';
    
    try {
      const digits = val.replace(/\D+/g, '').slice(0, 9);
      return digits.replace(/(\d{3})(\d{0,3})(\d{0,3}).*/, (m, a, b, c) => [a, b, c].filter(Boolean).join(' '));
    } catch (error) {
      console.warn('Erro ao formatar telefone:', error);
      return val || '';
    }
  };

  // CC (se tipo = CC): 8 dígitos
  const formatCC = (val) => {
    if (!val || typeof val !== 'string') return '';
    
    try {
      return val.replace(/\D/g, '').slice(0, 8);
    } catch (error) {
      console.warn('Erro ao formatar CC:', error);
      return val || '';
    }
  };

  // Passaporte: alfanumérico maiúsculas até 12
  const formatPassaporte = (val) => {
    if (!val || typeof val !== 'string') return '';
    
    try {
      return val.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 12);
    } catch (error) {
      console.warn('Erro ao formatar passaporte:', error);
      return val || '';
    }
  };

  // Matrícula: sempre XX-XX-XX (grupos de 2), alfanumérico maiúsculas
  const formatMatricula = (val) => {
    if (!val || typeof val !== 'string') return '';
    
    try {
      const raw = val.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6);
      const g1 = raw.slice(0, 2);
      const g2 = raw.slice(2, 4);
      const g3 = raw.slice(4, 6);
      return [g1, g2, g3].filter(Boolean).join('-');
    } catch (error) {
      console.warn('Erro ao formatar matrícula:', error);
      return val || '';
    }
  };

  // VIN: 17 chars alfanuméricos maiúsculos (exclui I, O, Q por convenção)
  const formatVin = (val) => {
    if (!val || typeof val !== 'string') return '';
    
    try {
      return val
        .toUpperCase()
        .replace(/[IOQ]/g, '')
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 17);
    } catch (error) {
      console.warn('Erro ao formatar VIN:', error);
      return val || '';
    }
  };

  const formatNumero = (val) => {
    if (!val || typeof val !== 'string') return '';
    
    try {
      return val.replace(/[^0-9]+/g, '');
    } catch (error) {
      console.warn('Erro ao formatar número:', error);
      return val || '';
    }
  };

  const clampPercent = (val) => {
    if (!val || typeof val !== 'string') return '';
    
    try {
      const n = parseInt(val.replace(/\D/g, ''), 10);
      if (Number.isNaN(n)) return '';
      return String(clamp(n, 0, 100));
    } catch (error) {
      console.warn('Erro ao formatar percentagem:', error);
      return val || '';
    }
  };

  const attach = (id, formatter) => {
    if (!id || !formatter) return;
    
    try {
      const el = document.getElementById(id);
      if (!el) return;
      
      const handleInput = () => setFormatted(el, formatter);
      el.addEventListener('input', handleInput);
      
      // formato inicial (caso existam valores pré-preenchidos)
      setFormatted(el, formatter);
      
      // Guardar referência para limpeza posterior
      el._inputFormatter = handleInput;
    } catch (error) {
      console.warn(`Erro ao anexar formatador ao elemento ${id}:`, error);
    }
  };

  const idsIfPresent = (pairs) => {
    if (!Array.isArray(pairs)) return;
    
    pairs.forEach(([id, fmt]) => {
      if (id && fmt) {
        attach(id, fmt);
      }
    });
  };

  const initGlobal = () => {
    try {
      // Novo/Editar Aluguer — Cliente
      idsIfPresent([
        ['clienteNif', formatNif],
        ['clienteContacto', formatPhone],
      ]);

      // Número do documento dependente do tipo
      const docTipo = document.getElementById('clienteDocTipo');
      const docNum = document.getElementById('clienteDocNumero');
      
      if (docNum) {
        const applyDocFmt = () => {
          try {
            const tipo = (docTipo && docTipo.value) || 'CC';
            const fmt = tipo === 'CC' ? formatCC : formatPassaporte;
            setFormatted(docNum, (v) => fmt(v));
          } catch (error) {
            console.warn('Erro ao aplicar formato do documento:', error);
          }
        };
        
        docNum.addEventListener('input', applyDocFmt);
        docTipo?.addEventListener('change', applyDocFmt);
        applyDocFmt();
      }

      // Veículos (criação/edição) e edição de contrato — Matrícula, VIN, números
      idsIfPresent([
        ['fMatricula', formatMatricula],
        ['veicMatricula', formatMatricula],
        ['fVin', formatVin],
        ['veicVin', formatVin],
        ['fKm', formatNumero],
        ['veicKm', formatNumero],
        ['fAno', formatNumero],
        ['veicAno', formatNumero],
      ]);

      // Percentagens nível de combustível (0-100)
      idsIfPresent([
        ['fNivelComb', clampPercent],
        ['veicComb', clampPercent],
        ['veicCombAtual', clampPercent],
      ]);
    } catch (error) {
      console.error('Erro ao inicializar formatadores de input:', error);
    }
  };

  // Função de limpeza para remover event listeners
  const cleanup = () => {
    try {
      const inputs = document.querySelectorAll('input[id]');
      inputs.forEach(input => {
        if (input._inputFormatter) {
          input.removeEventListener('input', input._inputFormatter);
          delete input._inputFormatter;
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar formatadores de input:', error);
    }
  };

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobal);
  } else {
    initGlobal();
  }

  // Limpeza na saída da página
  window.addEventListener('beforeunload', cleanup);
  
  // Expor funções para uso externo
  window.inputFormatters = {
    formatNif,
    formatPhone,
    formatCC,
    formatPassaporte,
    formatMatricula,
    formatVin,
    formatNumero,
    clampPercent,
    attach,
    cleanup
  };
})();

