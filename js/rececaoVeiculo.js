  
// ===============================
// Função para comprimir imagens antes do envio
// ===============================
async function compressImage(file, maxWidth = 1280, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = e => {
            img.src = e.target.result;
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((maxWidth / width) * height);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                blob => {
                    if (!blob) {
                        reject(new Error("Erro ao comprimir imagem"));
                        return;
                    }
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = err => reject(err);
        reader.readAsDataURL(file);
    });
}

// ===============================
// Captura evento de fotos e comprime automaticamente
// ===============================
document.addEventListener('change', async (e) => {
    if (e.target.classList.contains('veicFoto')) {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                const dt = new DataTransfer();
                dt.items.add(compressed);
                e.target.files = dt.files;

                console.log(`Imagem comprimida: ${(compressed.size / 1024).toFixed(1)} KB`);
            } catch (err) {
                console.error("Erro ao comprimir imagem:", err);
            }
        }
    }
});

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
  const abrirDanosBtn = document.getElementById('abrirDanos');
  const danosStatus = document.getElementById('danosStatus');

  if (!form || !submitBtn) return;

  let signaturePadRececao;
  let resizeSignaturePadRececao;
  let signaturePadCliente;
  let resizeSignaturePadCliente;
  let contratoAtual = null;
  let contratoIdFromUrl = null;
  let danosPromptShown = false;

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

  // Inicializar assinatura do cliente
  const initSignaturePadCliente = () => {
    const canvas = document.getElementById('signaturePadCliente');
    if (!canvas || !window.SignaturePad) return;
    signaturePadCliente = new SignaturePad(canvas, { backgroundColor: '#ffffff' });
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
      try { signaturePadCliente.clear(); } catch {}
    };
    resizeSignaturePadCliente = resize;
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    const clearBtn = document.getElementById('clearSignatureCliente');
    clearBtn?.addEventListener('click', () => signaturePadCliente.clear());
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
      console.error('Erro ao carregar contrato:', error);
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
        console.error('Erro ao processar foto:', error);
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
        checklistDetalhado: {
          carroçaria: {
            capot: !!document.getElementById('chkCapot')?.checked,
            paraChoquesFrente: !!document.getElementById('chkParaChoquesFrente')?.checked,
            paraChoquesTras: !!document.getElementById('chkParaChoquesTras')?.checked,
            portaFrenteEsq: !!document.getElementById('chkPortaFrenteEsq')?.checked,
            portaFrenteDir: !!document.getElementById('chkPortaFrenteDir')?.checked,
            portaTrasEsq: !!document.getElementById('chkPortaTrasEsq')?.checked,
            portaTrasDir: !!document.getElementById('chkPortaTrasDir')?.checked,
            guardaLamasEsq: !!document.getElementById('chkGuardaLamasEsq')?.checked,
            guardaLamasDir: !!document.getElementById('chkGuardaLamasDir')?.checked,
            tejadilho: !!document.getElementById('chkTejadilho')?.checked,
          },
          jantesPneus: {
            pneuFE: !!document.getElementById('chkPneuFE')?.checked,
            pneuFD: !!document.getElementById('chkPneuFD')?.checked,
            pneuTE: !!document.getElementById('chkPneuTE')?.checked,
            pneuTD: !!document.getElementById('chkPneuTD')?.checked,
            jantesOK: !!document.getElementById('chkJantesOK')?.checked,
            pneuSuplente: !!document.getElementById('chkPneuSuplente')?.checked,
            macaco: !!document.getElementById('chkMacaco')?.checked,
            chaveRodas: !!document.getElementById('chkChaveRodas')?.checked,
          },
          vidrosEspelhos: {
            parabrisas: !!document.getElementById('chkParabrisas')?.checked,
            vidroTraseiro: !!document.getElementById('chkVidroTraseiro')?.checked,
            vidrosLaterais: !!document.getElementById('chkVidrosLaterais')?.checked,
            espelhos: !!document.getElementById('chkEspelhos')?.checked,
          },
          luzes: {
            medios: !!document.getElementById('chkLuzMedios')?.checked,
            maximos: !!document.getElementById('chkLuzMaximos')?.checked,
            piscas: !!document.getElementById('chkLuzPiscas')?.checked,
            traseiras: !!document.getElementById('chkLuzTraseiras')?.checked,
            stop: !!document.getElementById('chkLuzStop')?.checked,
            re: !!document.getElementById('chkLuzRe')?.checked,
            nevoeiro: !!document.getElementById('chkLuzNevoeiro')?.checked,
          },
          interior: {
            bancos: !!document.getElementById('chkBancos')?.checked,
            tapetes: !!document.getElementById('chkTapetes')?.checked,
            estofos: !!document.getElementById('chkEstofos')?.checked,
            tablier: !!document.getElementById('chkTablier')?.checked,
            radio: !!document.getElementById('chkRadio')?.checked,
            ac: !!document.getElementById('chkAC')?.checked,
          },
          equipamentoDocs: {
            triangulo: !!document.getElementById('chkTriangulo')?.checked,
            colete: !!document.getElementById('chkColete')?.checked,
            kitSocorros: !!document.getElementById('chkKitSocorros')?.checked,
            dua: !!document.getElementById('chkDUA')?.checked,
            seguro: !!document.getElementById('chkSeguro')?.checked,
            inspecao: !!document.getElementById('chkInspecao')?.checked,
            segundaChave: !!document.getElementById('chk2aChave')?.checked,
          },
          eletronica: {
            vidrosEletricos: !!document.getElementById('chkVidrosEletricos')?.checked,
            travaoMao: !!document.getElementById('chkTravaoMao')?.checked,
            fechosPortas: !!document.getElementById('chkFechosPortas')?.checked,
            alarme: !!document.getElementById('chkAlarme')?.checked,
          },
          fluidos: {
            oleo: !!document.getElementById('chkOleo')?.checked,
            refrigerante: !!document.getElementById('chkRefrigerante')?.checked,
            limpaParaBrisas: !!document.getElementById('chkLimpaParaBrisas')?.checked,
          }
        },
        fotosDevolucao: fotos,
        danosIdentificados: await obterResumoDanos(contratoAtual._id),
        observacoesRececao: document.getElementById('obsRececao')?.value || '',
        assinaturaCliente: signaturePadCliente && !signaturePadCliente.isEmpty() ? signaturePadCliente.toDataURL() : null,
        assinaturaRececao: signaturePadRececao && !signaturePadRececao.isEmpty() ? signaturePadRececao.toDataURL() : null,
        recebidoEm: agoraIso,
        recebidoPor: userMeta
      };

      // Anexar detalhes de danos (inclui fotos) para aparecerem no PDF
      try {
        dadosRececao.danosDetalhados = await obterDanosDetalhados(contratoAtual._id);
      } catch {}

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
            estadoChecklist: existente.estadoChecklist || {},
            fotos: fotosAtualizadas,
            // Opcional: marcar disponibilidade do veículo como disponível novamente
            disponivel: true,
            atualizadoPor: userMeta,
            atualizadoEm: agoraIso
          };
          await veiculoRef.set(atualizado);
        } else {
          console.warn('Veículo não encontrado no stock para atualização (sem veiculoId e sem matrícula correspondente).');
        }
      } catch (e) {
        console.error('Erro ao atualizar veículo no stock:', e);
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
      console.error('Erro ao submeter receção:', error);
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

  const abrirDanos = () => {
    const prefill = '';
    const id = contratoAtual?._id || contratoIdFromUrl || '';
    if (!id) { alert('Contrato não carregado ainda. Aguarde um momento.'); return; }
    window.location.href = `danos.html?id=${encodeURIComponent(id)}&back=rececao${prefill}`;
  };
  abrirDanosBtn?.addEventListener('click', abrirDanos);

  async function atualizarStatusDanos(id){
    try {
      const snap = await db.ref(`danos/${id}`).once('value');
      const d = snap.val();
      const count = Array.isArray(d?.items) ? d.items.length : 0;
      if (danosStatus) {
        danosStatus.textContent = count > 0 ? `Danos registados: ${count}` : 'Sem danos registados';
        danosStatus.className = count > 0 ? 'badge warning' : 'muted';
      }
    } catch {}
  }

  async function obterResumoDanos(id){
    try {
      const snap = await db.ref(`danos/${id}`).once('value');
      const d = snap.val();
      const items = Array.isArray(d?.items) ? d.items : [];
      if (items.length === 0) return '';
      const linhas = items.map((it, idx) => `${idx+1}. ${it.tipo || 'Dano'} em ${it.localizacao || '—'}${it.dimensao ? ` (${it.dimensao})` : ''} — ${it.severidade || 'Leve'}${typeof it.custoEstimado === 'number' && it.custoEstimado > 0 ? ` — Estimativa: €${it.custoEstimado.toFixed(2)}` : ''}`);
      return `Foram registados ${items.length} dano(s):\n` + linhas.join('\n');
    } catch {
      return '';
    }
  }

  async function obterDanosDetalhados(id){
    try {
      const snap = await db.ref(`danos/${id}`).once('value');
      const d = snap.val();
      const items = Array.isArray(d?.items) ? d.items : [];
      // sanitizar campos
      const normalized = [];
      for (const it of items){
        const fotosSrc = Array.isArray(it.fotos) ? it.fotos : [];
        const fotosJpeg = [];
        for (const f of fotosSrc){
          try {
            const jpg = await resizeImageDataURL(f, 1280, 1280); // força JPEG via utils
            fotosJpeg.push(jpg);
          } catch { fotosJpeg.push(f); }
        }
        normalized.push({
          id: it.id || uuid(),
          localizacao: it.localizacao || '',
          tipo: it.tipo || '',
          severidade: it.severidade || 'Leve',
          dimensao: it.dimensao || '',
          descricao: it.descricao || '',
          custoEstimado: typeof it.custoEstimado === 'number' ? it.custoEstimado : Number(it.custoEstimado) || 0,
          responsabilidade: it.responsabilidade || 'A apurar',
          fotos: fotosJpeg,
        });
      }
      return normalized;
    } catch {
      return [];
    }
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
    contratoIdFromUrl = contratoId;
    
    if (!contratoId) {
      alert('ID do contrato não especificado!');
      window.location.href = 'historico.html';
      return;
    }

    // Inicializar SignaturePad
    initSignaturePad();
    initSignaturePadCliente();
    
    // Carregar dados do contrato
    await carregarContrato(contratoId);
    atualizarStatusDanos(contratoId);
  };

  // Executar inicialização quando a página estiver pronta
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
