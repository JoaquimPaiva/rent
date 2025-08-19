(function initRececaoVeiculo() {
  const form = document.getElementById('rececaoForm');
  const submitBtn = document.getElementById('submitBtn');
  const formMsg = document.getElementById('formMsg');
  const contratoIdSpan = document.getElementById('contratoId');
  const clienteNomeSpan = document.getElementById('clienteNome');
  const veiculoInfoSpan = document.getElementById('veiculoInfo');
  const periodoAluguerSpan = document.getElementById('periodoAluguer');
  const fotosWrap = document.getElementById('veicFotosWrap');
  const addFotoBtn = document.getElementById('addFoto');

  if (!form || !submitBtn) return;

  let signaturePadRececao;
  let resizeSignaturePadRececao;
  let contratoAtual = null;

  // Inicializar SignaturePad
  const initSignaturePad = () => {
    const canvas = document.getElementById('signaturePadRececao');
    if (!canvas || !window.SignaturePad) return;
    signaturePadRececao = new SignaturePad(canvas, { backgroundColor: '#ffffff' });
    const aspect = 180 / 299;
    const resize = () => {
      const parent = canvas.parentElement || canvas;
      const maxWidth = parent.clientWidth || 300;
      const displayWidth = Math.max(260, Math.min(700, maxWidth));
      const displayHeight = Math.round(displayWidth * aspect);
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = Math.floor(displayWidth * ratio);
      canvas.height = Math.floor(displayHeight * ratio);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      try { signaturePadRececao.clear(); } catch {}
    };
    resizeSignaturePadRececao = resize;
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    const clearBtn = document.getElementById('clearSignatureRececao');
    clearBtn?.addEventListener('click', () => signaturePadRececao.clear());
  };

  // Carregar dados do contrato
  const carregarContrato = async (contratoId) => {
    try {
      const snapshot = await db.ref(`alugueres/${contratoId}`).once('value');
      const contrato = snapshot.val();
      
      if (!contrato) {
        alert('Contrato não encontrado!');
        window.location.href = 'historico.html';
        return;
      }

      contratoAtual = { _id: contratoId, ...contrato };
      
      // Preencher informações do contrato
      if (contratoIdSpan) {
        contratoIdSpan.textContent = `ID: ${contratoId}`;
      }
      
      if (clienteNomeSpan) {
        clienteNomeSpan.textContent = contrato.cliente?.nome || '—';
      }
      
      if (veiculoInfoSpan) {
        const v = contrato.veiculo || {};
        veiculoInfoSpan.textContent = `${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
      }
      
      if (periodoAluguerSpan) {
        const a = contrato.aluguer || {};
        periodoAluguerSpan.textContent = `${a.inicio || ''} → ${a.fim || ''}`;
      }

      // Preencher campos com valores iniciais
      const v = contrato.veiculo || {};
      const kmField = document.getElementById('veicKmAtual');
      const combField = document.getElementById('veicCombAtual');
      
      if (kmField) {
        kmField.value = v.quilometragem || v.km || '';
      }
      
      if (combField) {
        combField.value = v.nivelCombustivel ? parseInt(v.nivelCombustivel.replace('%', '')) : 75;
      }
      
      // Definir data atual como padrão para devolução
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      const dataDevolucaoField = document.getElementById('dataDevolucao');
      if (dataDevolucaoField) {
        dataDevolucaoField.value = localDateTime;
      }

    } catch (error) {
      alert('Erro ao carregar dados do contrato.');
    }
  };

  // Adicionar campo de foto
  const adicionarCampoFoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.className = 'veicFoto';
    fotosWrap.appendChild(input);
  };

  // Processar fotos
  const processarFotos = async () => {
    const fileInputs = Array.from(document.querySelectorAll('.veicFoto'));
    const fotos = [];
    
    for (const input of fileInputs) {
      const file = input.files && input.files[0];
      if (!file) continue;
      
      try {
        const dataUrl = await fileToDataURL(file);
        const resized = await resizeImageDataURL(dataUrl, 1280, 1280);
        fotos.push(resized);
      } catch (error) {
        }
    }
    
    return fotos;
  };

  // Escolher fotos a persistir no veículo: se houver novas, substitui todas as antigas
  const escolherFotosVeiculo = (fotosExistentes, fotosNovas) => {
    const novas = Array.isArray(fotosNovas) ? fotosNovas : [];
    if (novas.length > 0) return novas;
    const antigas = Array.isArray(fotosExistentes) ? fotosExistentes : [];
    return antigas;
  };

  // Submeter formulário
  const submeterFormulario = async (e) => {
    e.preventDefault();
    
    if (!contratoAtual) {
      alert('Contrato não carregado!');
      return;
    }

    try {
      submitBtn.disabled = true;
      formMsg.hidden = true;

      // Validar campos obrigatórios
      const camposObrigatorios = [
        { id: 'veicKmAtual', nome: 'Quilometragem atual' },
        { id: 'veicCombAtual', nome: 'Nível de combustível' },
        { id: 'dataDevolucao', nome: 'Data e hora da devolução' },
        { id: 'veicEstadoDevolucao', nome: 'Estado geral na devolução' }
      ];

      for (const campo of camposObrigatorios) {
        const campoElement = document.getElementById(campo.id);
        if (!campoElement || !campoElement.value.trim()) {
          alert(`Por favor, preencha o campo: ${campo.nome}`);
          if (campoElement) campoElement.focus();
          return;
        }
      }

      // Processar fotos
      const fotos = await processarFotos();
      if (fotos.length < 4) {
        alert('Por favor, adicione pelo menos 4 fotografias do veículo.');
        return;
      }

      // Obter dados do formulário
      const user = auth?.currentUser || null;
      const userMeta = { uid: user?.uid || null, email: user?.email || null, nome: (user?.displayName || user?.email || '—') };
      const agoraIso = new Date().toISOString();

      const dadosRececao = {
        quilometragemDevolucao: parseInt(document.getElementById('veicKmAtual').value) || 0,
        nivelCombustivelDevolucao: parseInt(document.getElementById('veicCombAtual').value) || 0,
        dataDevolucao: document.getElementById('dataDevolucao').value || '',
        estadoGeralDevolucao: document.getElementById('veicEstadoDevolucao').value || '',
        estadoPneus: document.getElementById('estadoPneusDevolucao')?.checked || false,
        estadoPintura: document.getElementById('estadoPinturaDevolucao')?.checked || false,
        estadoVidros: document.getElementById('estadoVidrosDevolucao')?.checked || false,
        estadoInterior: document.getElementById('estadoInteriorDevolucao')?.checked || false,
        estadoLuzes: document.getElementById('estadoLuzesDevolucao')?.checked || false,
        fotosDevolucao: fotos,
        danosIdentificados: document.getElementById('danosIdentificados')?.value || '',
        observacoesRececao: document.getElementById('obsRececao')?.value || '',
        assinaturaRececao: signaturePadRececao ? signaturePadRececao.toDataURL() : null,
        recebidoEm: agoraIso,
        recebidoPor: userMeta
      };

      // Gerar PDF da receção e anexar em base64
      const pdfRececaoDataUri = await gerarRececaoPDF({ id: contratoAtual._id, ...contratoAtual, rececao: dadosRececao });
      const pdfRececaoBase64 = window.pdfUtils.extractBase64Pdf(pdfRececaoDataUri);

      // Criar cópia do contrato com dados da receção + pdfRececaoBase64
      const contratoCompleto = {
        ...contratoAtual,
        rececao: { ...dadosRececao, pdfBase64: pdfRececaoBase64 },
        aluguer: {
          ...contratoAtual.aluguer,
          estado: 'terminado',
          terminadoEm: agoraIso,
          terminadoPor: userMeta
        }
      };

      // Atualizar informações do veículo no stock, procurando por veiculoId ou matrícula
      try {
        let veiculoId = contratoAtual.veiculoId;

        // Fallback: procurar por matrícula no stock
        if (!veiculoId) {
          const matriculaContrato = (contratoAtual.veiculo?.matricula || '').trim().toLowerCase();
          if (matriculaContrato) {
            const snapAll = await db.ref('veiculos').once('value');
            const val = snapAll.val() || {};
            for (const [k, v] of Object.entries(val)) {
              const m = (v.matricula || '').trim().toLowerCase();
              if (m && m === matriculaContrato) { veiculoId = k; break; }
            }
          }
        }

        if (veiculoId) {
          const veiculoRef = db.ref(`veiculos/${veiculoId}`);
          const snap = await veiculoRef.once('value');
          const existente = snap.val() || {};

          const fotosExistentes = Array.isArray(existente.fotos) ? existente.fotos : [];
          const fotosNovas = Array.isArray(dadosRececao.fotosDevolucao) ? dadosRececao.fotosDevolucao : [];
          const fotosAtualizadas = escolherFotosVeiculo(fotosExistentes, fotosNovas);

          const quilometragemAtualizada = Number.isFinite(dadosRececao.quilometragemDevolucao)
            ? dadosRececao.quilometragemDevolucao
            : existente.quilometragem;
          const nivelCombustivelAtualizado = `${parseInt(dadosRececao.nivelCombustivelDevolucao || 0)}%`;

          const atualizado = {
            ...existente,
            quilometragem: quilometragemAtualizada,
            nivelCombustivel: nivelCombustivelAtualizado,
            estado: dadosRececao.estadoGeralDevolucao || existente.estado,
            estadoChecklist: {
              pneus: !!dadosRececao.estadoPneus,
              pintura: !!dadosRececao.estadoPintura,
              vidros: !!dadosRececao.estadoVidros,
              interior: !!dadosRececao.estadoInterior,
              luzes: !!dadosRececao.estadoLuzes,
            },
            fotos: fotosAtualizadas,
            // Opcional: marcar disponibilidade do veículo como disponível novamente
            disponivel: true,
            atualizadoPor: userMeta,
            atualizadoEm: agoraIso
          };
          await veiculoRef.set(atualizado);
        } else {
          console.warn('Veículo não encontrado no stock.');
        }
      } catch (e) {
        }

      // Mover contrato para terminados
      const contratoId = contratoAtual._id;
      delete contratoCompleto._id;

      await db.ref().update({
        [`alugueres_terminados/${contratoId}`]: contratoCompleto,
        [`alugueres/${contratoId}`]: null
      });

      // Disponibilizar o download/abertura do PDF de receção
      window.pdfUtils.downloadPdfDataUri(pdfRececaoDataUri, `rececao-${contratoId}.pdf`);

      alert('Receção concluída com sucesso! O contrato foi movido para "Terminados".');
      window.location.href = 'terminados.html';

    } catch (error) {
      formMsg.textContent = 'Erro ao submeter receção. Tente novamente.';
      formMsg.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  };

  // Event listeners
  form.addEventListener('submit', submeterFormulario);
  
  if (addFotoBtn) {
    addFotoBtn.addEventListener('click', adicionarCampoFoto);
  }

  // Limpar assinatura
  const clearSignatureRececao = document.getElementById('clearSignatureRececao');
  if (clearSignatureRececao) {
    clearSignatureRececao.addEventListener('click', () => {
      if (signaturePadRececao) {
        signaturePadRececao.clear();
      }
    });
  }

  // Inicializar
  const init = async () => {
    // Obter ID do contrato da URL
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get('id');
    
    if (!contratoId) {
      alert('ID do contrato não especificado!');
      window.location.href = 'historico.html';
      return;
    }

    // Inicializar SignaturePad
    initSignaturePad();
    
    // Carregar dados do contrato
    await carregarContrato(contratoId);
  };

  // Executar inicialização quando a página estiver pronta
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
