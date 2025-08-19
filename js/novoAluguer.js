(function initNovoAluguer(){
  const form = document.getElementById('aluguerForm');
  if (!form) return;

  // Helper functions fallback
  let fileToDataURL;
  if (typeof window.fileToDataURL === 'function') {
    fileToDataURL = window.fileToDataURL;
  } else {
    fileToDataURL = async function(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };
  }

  let resizeImageDataURL;
  if (typeof window.resizeImageDataURL === 'function') {
    resizeImageDataURL = window.resizeImageDataURL;
  } else {
    resizeImageDataURL = async function(dataUrl, maxW = 1280, maxH = 1280) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(maxW / width, maxH / height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = dataUrl;
      });
    };
  }

  let uuid;
  if (typeof window.uuid === 'function') {
    uuid = window.uuid;
  } else {
    uuid = function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  }

  // Adicionar também a função pdfUtils
  if (typeof window.pdfUtils === 'undefined') {
    window.pdfUtils = {
      dataUriToBlob: function(dataUri) {
        if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) {
          throw new Error('dataUri inválido');
        }
        const parts = dataUri.split(',');
        const meta = parts[0] || '';
        const base64 = (parts[1] || '').replace(/\s+/g, '');
        const mimeMatch = meta.match(/data:(.*?);base64/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: mime });
      },
      extractBase64Pdf: function(dataUriOrBase64) {
        if (!dataUriOrBase64) return '';
        if (typeof dataUriOrBase64 !== 'string') return '';
        if (dataUriOrBase64.startsWith('data:')) {
          return (dataUriOrBase64.split(',')[1] || '').replace(/\s+/g, '');
        }
        return dataUriOrBase64
          .replace(/^data:application\/pdf(?:;filename=[^;]+)?;base64,/, '')
          .replace(/\s+/g, '');
      },
      downloadBlob: function(blob, filename) {
        try {
          if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
            return;
          }
        } catch (e) {}
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      },
      downloadPdfDataUri: function(dataUri, filename) {
        try {
          const blob = this.dataUriToBlob(dataUri);
          this.downloadBlob(blob, filename);
        } catch (e) {
          try {
            window.open(dataUri, '_blank');
          } catch (err) {}
        }
      },
    };
  }

  // ---- Wizard (passo-a-passo) ----
  let currentStep = 1;
  const steps = Array.from(document.querySelectorAll('.wizard-step'));
  const getStepEl = (n) => steps.find(s => Number(s.getAttribute('data-step')) === n);
  const showStep = (n) => {
    currentStep = n;
    steps.forEach(s => { s.style.display = Number(s.getAttribute('data-step')) === n ? '' : 'none'; });
    
    // Atualizar indicador de progresso
    updateProgressIndicator(n);
    
    if (n === 4) { renderResumo(); }
    if (n === 5) {
      try { resizeSignaturePad?.(); } catch {}
      try { resizeSignaturePadLocadora?.(); } catch {}
    }
  };

  // Função para atualizar o indicador de progresso
  const updateProgressIndicator = (currentStep) => {
    const indicators = document.querySelectorAll('.wizard-step-indicator');
    indicators.forEach((indicator, index) => {
      const stepNumber = index + 1;
      indicator.classList.remove('active', 'completed');
      
      if (stepNumber === currentStep) {
        indicator.classList.add('active');
      } else if (stepNumber < currentStep) {
        indicator.classList.add('completed');
      }
    });
  };

  const validateStep = (n) => {
    // Valida apenas os campos visíveis do passo
    const stepEl = getStepEl(n);
    if (!stepEl) return true;
    const inputs = Array.from(stepEl.querySelectorAll('input, select, textarea'));
    // Usar checkValidity HTML5 quando existir required
    let ok = true;
    for (const el of inputs) {
      if (typeof el.reportValidity === 'function' && !el.reportValidity()) { ok = false; break; }
    }
    // Regras adicionais por passo
    if (ok && n === 2) {
      const sel = document.getElementById('selVeiculo');
      if (!sel || !sel.value) { sel?.focus(); ok = false; }
    }
    if (ok && n === 3) {
      const inicio = document.getElementById('algInicio');
      const fim = document.getElementById('algFim');
      if (inicio && fim && inicio.value && fim.value && new Date(fim.value) < new Date(inicio.value)) {
        try { fim.setCustomValidity('A data fim deve ser posterior ao início.'); fim.reportValidity(); } finally { fim.setCustomValidity(''); }
        ok = false;
      }
    }
    return ok;
  };

  const nextStep = () => { if (validateStep(currentStep)) showStep(Math.min(currentStep + 1, 5)); };
  const prevStep = () => { showStep(Math.max(currentStep - 1, 1)); };

  // Delegação botões próximo/anterior
  const onFormClick = (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.classList.contains('btn-next')) { e.preventDefault(); nextStep(); }
    if (t.classList.contains('btn-prev')) { e.preventDefault(); prevStep(); }
  };
  form.addEventListener('click', onFormClick);

  function renderResumo() {
    const wrap = document.getElementById('resumoConteudo');
    if (!wrap) return;
    const cliente = {
      nome: document.getElementById('clienteNome').value.trim(),
      docTipo: document.getElementById('clienteDocTipo').value,
      docNumero: document.getElementById('clienteDocNumero').value.trim(),
      nif: document.getElementById('clienteNif').value.trim(),
      dataNascimento: document.getElementById('clienteDataNasc').value,
      contacto: document.getElementById('clienteContacto').value.trim(),
      email: document.getElementById('clienteEmail').value.trim(),
      morada: document.getElementById('clienteMorada').value.trim(),
    };
    const veiculoSel = document.getElementById('selVeiculo');
    const veiculoTxt = veiculoSel && veiculoSel.selectedIndex > 0 ? veiculoSel.options[veiculoSel.selectedIndex].textContent : '—';
    const inicio = document.getElementById('algInicio').value;
    const fim = document.getElementById('algFim').value;
    const preco = document.getElementById('algPreco').value;
    const precoDiario = document.getElementById('algPrecoDiario')?.value || '';
    const caucao = document.getElementById('algCaucao')?.value || '';
    const formaPagamento = document.getElementById('algFormaPagamento')?.value || '';
    const localDevolucao = document.getElementById('algLocalDevolucao')?.value || '';
    const obs = document.getElementById('algObs').value || '';

    wrap.innerHTML = `
      <div class="grid-2">
        <div>
          <strong>Cliente</strong>
          <div class="muted">${cliente.nome}</div>
          <div class="muted">${cliente.docTipo} ${cliente.docNumero}</div>
          <div class="muted">NIF: ${cliente.nif}</div>
          <div class="muted">Nascimento: ${cliente.dataNascimento}</div>
          <div class="muted">Contacto: ${cliente.contacto}</div>
          <div class="muted">Email: ${cliente.email}</div>
          <div class="muted">Morada: ${cliente.morada}</div>
        </div>
        <div>
          <strong>Veículo</strong>
          <div class="muted">${veiculoTxt || '—'}</div>
        </div>
      </div>
      <div style="margin-top:8px">
        <strong>Aluguer</strong>
        <div class="muted">Início: ${inicio || '—'}</div>
        <div class="muted">Fim: ${fim || '—'}</div>
        <div class="muted">Preço total: ${preco ? Number(preco).toFixed(2) + ' €' : '—'}</div>
        <div class="muted">Preço diário: ${precoDiario ? Number(precoDiario).toFixed(2) + ' €' : '—'}</div>
        <div class="muted">Caução: ${caucao ? Number(caucao).toFixed(2) + ' €' : '—'}</div>
        <div class="muted">Forma de pagamento: ${formaPagamento || '—'}</div>
        <div class="muted">Local de devolução: ${localDevolucao || '—'}</div>
        ${obs ? `<div class="muted">Observações: ${obs}</div>` : ''}
      </div>
    `;
  }

  // Garantir início no passo 1
  showStep(1);

  let signaturePad;
  let signaturePadLocadora;
  let resizeSignaturePad;
  let resizeSignaturePadLocadora;
  let veiculoSelecionado = null;
  let veiculoSelecionadoId = null;
  let veiculosLista = [];
  let indisponiveisPorId = new Set();
  let indisponiveisPorMatricula = new Set();
  const canvas = document.getElementById('signaturePad');
  const clearBtn = document.getElementById('clearSignature');
  const canvasLoc = document.getElementById('signaturePadLocadora');
  const clearBtnLoc = document.getElementById('clearSignatureLocadora');

  // Usar helper comum
  let sigCleanup = null; let sigLocCleanup = null;
  if (canvas && window.forms?.createSignaturePad) {
    const { pad, resize, cleanup } = window.forms.createSignaturePad(canvas, clearBtn);
    signaturePad = pad; resizeSignaturePad = resize; sigCleanup = cleanup;
  }
  if (canvasLoc && window.forms?.createSignaturePad) {
    const { pad, resize, cleanup } = window.forms.createSignaturePad(canvasLoc, clearBtnLoc);
    signaturePadLocadora = pad; resizeSignaturePadLocadora = resize; sigLocCleanup = cleanup;
  }

  // Adicionar inputs de fotografia dinamicamente (melhor UX no mobile)
  const fotosWrap = document.getElementById('veicFotosWrap');
  const addFotoBtn = document.getElementById('addFoto');
  addFotoBtn?.addEventListener('click', () => {
    if (!fotosWrap) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.className = 'veicFoto';
    fotosWrap.appendChild(input);
    // Abre diretamente a câmara/seleção de ficheiro para agilizar no mobile
    try { input.click(); } catch {}
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Impede submissão antes do último passo; avança se válido
    if (currentStep < 5) {
      nextStep();
      return;
    }
    const msg = document.getElementById('formMsg');
    msg.hidden = true;
    const submitBtn = document.getElementById('submitBtn');

    try {
      if (submitBtn) submitBtn.disabled = true;
      if (msg) { msg.textContent = 'A submeter...'; msg.hidden = false; }
      const cliente = {
        nome: document.getElementById('clienteNome').value.trim(),
        documento: {
          tipo: document.getElementById('clienteDocTipo').value,
          numero: document.getElementById('clienteDocNumero').value.trim()
        },
        nif: document.getElementById('clienteNif').value.trim(),
        dataNascimento: document.getElementById('clienteDataNasc').value,
        contacto: document.getElementById('clienteContacto').value.trim(),
        email: document.getElementById('clienteEmail').value.trim(),
        morada: document.getElementById('clienteMorada').value.trim()
      };

      if (!veiculoSelecionado) {
        throw new Error('Seleciona um veículo do stock.');
      }
      // Verificação de disponibilidade no momento da submissão
      const matriculaNorm = (veiculoSelecionado.matricula || '').trim().toLowerCase();
      if ((veiculoSelecionadoId && indisponiveisPorId.has(veiculoSelecionadoId)) ||
          (matriculaNorm && indisponiveisPorMatricula.has(matriculaNorm))) {
        throw new Error('O veículo selecionado encontra-se num contrato em vigor.');
      }
      // Clonar o objeto do veículo selecionado para o contrato
      const veiculo = JSON.parse(JSON.stringify(veiculoSelecionado));

      const precoTotalVal = Number(document.getElementById('algPreco').value);
      const precoDiarioVal = Number(document.getElementById('algPrecoDiario')?.value || '');
      const caucaoVal = Number(document.getElementById('algCaucao')?.value || '');
      const aluguer = {
        inicio: document.getElementById('algInicio').value,
        fim: document.getElementById('algFim').value,
        precoTotal: Number.isFinite(precoTotalVal) ? precoTotalVal : 0,
        precoDiario: Number.isFinite(precoDiarioVal) ? precoDiarioVal : undefined,
        precoCaucao: Number.isFinite(caucaoVal) ? caucaoVal : undefined,
        formaPagamento: document.getElementById('algFormaPagamento')?.value || undefined,
        localDevolucao: document.getElementById('algLocalDevolucao')?.value.trim() || undefined,
        observacoes: document.getElementById('algObs').value.trim(),
        assinatura: signaturePad && !signaturePad.isEmpty() ? signaturePad.toDataURL('image/png') : null,
        assinaturaLocadora: signaturePadLocadora && !signaturePadLocadora.isEmpty() ? signaturePadLocadora.toDataURL('image/png') : null
      };

      // Validar inputs simples
      if (!cliente.nome || !veiculo.matricula || !aluguer.inicio || !aluguer.fim) {
        throw new Error('Preenche os campos obrigatórios.');
      }

      // Imagens para base64 (com resize) a partir de múltiplos inputs
      const fileInputs = Array.from(document.querySelectorAll('#veicFotosWrap .veicFoto'));
      const base64Fotos = [];
      for (const input of fileInputs) {
        const file = input.files && input.files[0];
        if (!file) continue;
        const dataUrl = await fileToDataURL(file);
        const resized = await resizeImageDataURL(dataUrl, 1280, 1280);
        base64Fotos.push(resized);
      }
      // Construir lista final de fotos a partir das imagens visíveis + novas capturadas
      const fotosWrapEl = document.getElementById('veicFotosWrap');
      const fotosVisiveis = fotosWrapEl ? Array.from(fotosWrapEl.querySelectorAll('img')).map(img => img.src) : [];
      veiculo.fotos = fotosVisiveis.length ? [...fotosVisiveis, ...base64Fotos] : base64Fotos;

      const data = { cliente, veiculo, aluguer, veiculoId: veiculoSelecionadoId || undefined };

      // Atualizar as fotos do veículo no stock, se aplicável
      if (veiculoSelecionadoId) {
        try {
          const user = auth?.currentUser || null;
          const userMeta = { uid: user?.uid || null, email: user?.email || null, nome: (user?.displayName || user?.email || '—') };
          const agoraIso = new Date().toISOString();
          await db.ref(`veiculos/${veiculoSelecionadoId}`).update({
            fotos: Array.isArray(veiculo.fotos) ? veiculo.fotos : [],
            atualizadoPor: userMeta,
            atualizadoEm: agoraIso
          });
        } catch (e) {
          console.warn('Não foi possível atualizar as fotos no stock do veículo agora.', e);
        }
      }

      // Escrever no Realtime Database (gerar id determinístico)
      const id = uuid();
      const user = auth?.currentUser || null;
      const userMeta = {
        uid: user?.uid || null,
        email: user?.email || null,
        nome: (user?.displayName || user?.email || '—')
      };
      const agoraIso = new Date().toISOString();
      const registro = {
        ...data,
        criadoPor: userMeta,
        criadoEm: agoraIso
      };

      // Gerar PDF (dataUri) antes de gravar (obrigatório)
      // Verificar se jsPDF está disponível
      if (typeof window.jspdf === 'undefined' || !window.jspdf || !window.jspdf.jsPDF) {
        throw new Error('jsPDF não está disponível. Verifique se o script foi carregado corretamente.');
      }

      // Verificar se pdfUtils está disponível
      if (typeof window.pdfUtils === 'undefined' || !window.pdfUtils) {
        throw new Error('pdfUtils não está disponível');
      }

      // Verificar se gerarContratoPDF está disponível
      if (typeof gerarContratoPDF !== 'function') {
        throw new Error('Função gerarContratoPDF não está disponível');
      }

      let pdfDataUri = await gerarContratoPDF({ id, ...data, criadoPor: userMeta, criadoEm: agoraIso }, { deposit: Number.isFinite(caucaoVal) ? caucaoVal : undefined });
      // Extrair base64 de forma robusta
      registro.pdfBase64 = window.pdfUtils.extractBase64Pdf(pdfDataUri);

      await db.ref(`alugueres/${id}`).set(registro);

      msg.textContent = 'Aluguer submetido com sucesso!';
      msg.hidden = false;

      // Disponibilizar download do PDF com compatibilidade
      window.pdfUtils.downloadPdfDataUri(pdfDataUri, `contrato-${id}.pdf`);

      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
    } catch (err) {
      console.error(err);
      const msg = document.getElementById('formMsg');
      msg.textContent = 'Erro ao submeter: ' + (err?.message || 'tenta novamente.');
      msg.hidden = false;
    }
    finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Secção: seletor de veículos do stock
  const selVeiculo = document.getElementById('selVeiculo');
  const detCard = document.getElementById('veiculoDetalhes');
  const vdTitulo = document.getElementById('vdTitulo');
  const vdLinha1 = document.getElementById('vdLinha1');
  const vdLinha2 = document.getElementById('vdLinha2');

  const preencherDetalhes = (v) => {
    if (!v) { detCard.style.display='none'; return; }
    detCard.style.display='block';
    vdTitulo.textContent = `${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
    vdLinha1.textContent = `${v.cor || ''} • ${v.combustivel || ''} • ${Number.isFinite(v.ano) ? v.ano : ''}`.trim();
    vdLinha2.textContent = `${Number.isFinite(v.quilometragem) ? v.quilometragem + ' km' : ''} • ${v.nivelCombustivel || ''}`.trim();
    const wrap = document.getElementById('veicFotosWrap');
    if (wrap) {
      wrap.innerHTML = '';
      (v.fotos || []).forEach((foto) => {
        const fotoContainer = document.createElement('div');
        fotoContainer.style.position = 'relative';
        fotoContainer.style.display = 'inline-block';
        fotoContainer.style.margin = '4px';

        const img = document.createElement('img');
        img.src = foto;
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.objectFit = 'cover';
        img.style.border = '1px solid #ccc';
        img.style.borderRadius = '4px';

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '-8px';
        removeBtn.style.right = '-8px';
        removeBtn.style.width = '20px';
        removeBtn.style.height = '20px';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.border = 'none';
        removeBtn.style.background = 'var(--danger)';
        removeBtn.style.color = 'white';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '14px';
        removeBtn.style.fontWeight = 'bold';
        removeBtn.onclick = () => fotoContainer.remove();

        fotoContainer.appendChild(img);
        fotoContainer.appendChild(removeBtn);
        wrap.appendChild(fotoContainer);
      });
      const input = document.createElement('input');
      input.type='file'; input.accept='image/*'; input.capture='environment'; input.className='veicFoto';
      wrap.appendChild(input);
    }
  };

  const popularSeletor = (todos) => {
    if (!selVeiculo) return;
    const atual = selVeiculo.value;
    selVeiculo.innerHTML = '<option value="">Seleciona um veículo do stock…</option>';
    for (const v of todos) {
      const opt = document.createElement('option');
      opt.value = v._id;
      const matriculaNorm = (v.matricula || '').trim().toLowerCase();
      const estaIndisponivel = (v._id && indisponiveisPorId.has(v._id)) || (matriculaNorm && indisponiveisPorMatricula.has(matriculaNorm));
      opt.textContent = `${v.marca || ''} ${v.modelo || ''} • ${v.matricula || ''}${estaIndisponivel ? ' (indisponível)' : ''}`;
      if (estaIndisponivel) {
        opt.disabled = true;
      }
      selVeiculo.appendChild(opt);
    }
    if (atual) selVeiculo.value = atual;
  };

  let veiculosRef = null; let alugueresRef = null;
  let veiculosCb = null; let alugueresCb = null;
  if (selVeiculo) {
    auth.onAuthStateChanged((user) => {
      if (!user) return;
      // Carregar veículos
      veiculosRef = db.ref('veiculos');
      veiculosCb = (snap) => {
        const val = snap.val() || {};
        veiculosLista = Object.entries(val).map(([k, v]) => ({ _id: k, ...v }));
        popularSeletor(veiculosLista);
      };
      veiculosRef.on('value', veiculosCb);
      // Carregar contratos em vigor para apurar indisponíveis
      alugueresRef = db.ref('alugueres');
      alugueresCb = (snap) => {
        const val = snap.val() || {};
        const ids = new Set();
        const mats = new Set();
        for (const [, contrato] of Object.entries(val)) {
          const vid = contrato.veiculoId;
          if (vid) ids.add(vid);
          const mat = (contrato.veiculo?.matricula || '').trim().toLowerCase();
          if (mat) mats.add(mat);
        }
        indisponiveisPorId = ids;
        indisponiveisPorMatricula = mats;
        popularSeletor(veiculosLista);
      };
      alugueresRef.on('value', alugueresCb);
    });
    selVeiculo.addEventListener('change', async () => {
      const id = selVeiculo.value;
      if (!id) { veiculoSelecionado = null; preencherDetalhes(null); return; }
      const snap = await db.ref(`veiculos/${id}`).once('value');
      veiculoSelecionado = snap.val() || null;
      veiculoSelecionadoId = id;
      preencherDetalhes(veiculoSelecionado);
    });
  }

  // Pré-seleção via query string (veiculoId)
  const urlParams = new URLSearchParams(window.location.search);
  const veiculoId = urlParams.get('veiculoId');
  if (veiculoId && selVeiculo) {
    db.ref(`veiculos/${veiculoId}`).once('value').then((snap) => {
      if (snap.exists()) {
        veiculoSelecionado = snap.val();
        veiculoSelecionadoId = veiculoId;
        preencherDetalhes(veiculoSelecionado);
        // tenta definir o option quando já existir no DOM
        const trySet = () => { if (selVeiculo.querySelector(`option[value="${veiculoId}"]`)) selVeiculo.value = veiculoId; else setTimeout(trySet, 100); };
        trySet();
      }
    });
  }

  // Limpeza de listeners/eventos ao sair
  const cleanup = () => {
    try { form.removeEventListener('click', onFormClick); } catch {}
    try { sigCleanup?.(); } catch {}
    try { sigLocCleanup?.(); } catch {}
    try { if (veiculosRef && veiculosCb) veiculosRef.off('value', veiculosCb); } catch {}
    try { if (alugueresRef && alugueresCb) alugueresRef.off('value', alugueresCb); } catch {}
  };
  window.addEventListener('beforeunload', cleanup);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cleanup(); });
})();
 