(function initDanosPage(){
  const form = document.getElementById('danosForm');
  if (!form) return;

  const contratoIdSpan = document.getElementById('contratoId');
  const clienteNomeSpan = document.getElementById('clienteNome');
  const veiculoInfoSpan = document.getElementById('veiculoInfo');
  const periodoAluguerSpan = document.getElementById('periodoAluguer');
  const voltarRececao = document.getElementById('voltarRececao');
  const danosLista = document.getElementById('danosLista');
  const addDanoBtn = document.getElementById('addDano');
  const formMsg = document.getElementById('formMsg');

  let contratoAtual = null;

  function createFotoInputList(container){
    const wrap = document.createElement('div');
    wrap.className = 'foto-list';
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '8px';

    const first = document.createElement('input');
    first.type = 'file';
    first.accept = 'image/*';
    first.capture = 'environment';
    first.className = 'veicFoto danoFoto';
    wrap.appendChild(first);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn';
    addBtn.textContent = 'Adicionar fotografia';
    addBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.className = 'veicFoto danoFoto';
      wrap.insertBefore(input, addBtn);
    });
    wrap.appendChild(addBtn);
    container.appendChild(wrap);
    return wrap;
  }

  function addDanoItem(prefill){
    const card = document.createElement('div');
    card.className = 'card';
    if (prefill && prefill.id) { card.dataset.danoId = prefill.id; }

    const grid = document.createElement('div');
    grid.className = 'form-grid';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';
    header.innerHTML = '<strong>Dano</strong>';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn danger';
    removeBtn.textContent = 'Remover';
    removeBtn.addEventListener('click', () => card.remove());
    header.appendChild(removeBtn);

    // Campos
    const locLabel = document.createElement('label');
    locLabel.innerHTML = '<span>Localização do dano</span>';
    const locInput = document.createElement('input');
    locInput.type = 'text';
    locInput.placeholder = 'Ex.: Para-choques frontal, porta direita, jante traseira esquerda...';
    locInput.required = true;
    locLabel.appendChild(locInput);

    const tipoLabel = document.createElement('label');
    tipoLabel.innerHTML = '<span>Tipo de dano</span>';
    const tipoSelect = document.createElement('select');
    tipoSelect.required = true;
    const tipos = ['', 'Risco', 'Amasse', 'Quebra', 'Fissura', 'Falta de peça', 'Pintura danificada', 'Interior danificado', 'Vidro lascado/partido', 'Outros'];
    tipos.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t || 'Selecionar...';
      if (!t) { opt.disabled = true; opt.selected = true; }
      tipoSelect.appendChild(opt);
    });
    tipoLabel.appendChild(tipoSelect);

    const severLabel = document.createElement('label');
    severLabel.innerHTML = '<span>Severidade</span>';
    const severSelect = document.createElement('select');
    ['Leve','Moderado','Severo'].forEach(s => {
      const o = document.createElement('option'); o.value = s; o.textContent = s; severSelect.appendChild(o);
    });
    severLabel.appendChild(severSelect);

    const dimLabel = document.createElement('label');
    dimLabel.innerHTML = '<span>Dimensão aproximada</span>';
    const dimInput = document.createElement('input');
    dimInput.type = 'text';
    dimInput.placeholder = 'Ex.: ~5 cm, ~20x10 cm';
    dimLabel.appendChild(dimInput);

    const descLabel = document.createElement('label');
    descLabel.className = 'full';
    descLabel.innerHTML = '<span>Descrição detalhada</span>';
    const descArea = document.createElement('textarea');
    descArea.rows = 3;
    descArea.placeholder = 'Descreva o dano, contexto e observações...';
    descArea.required = true;
    descLabel.appendChild(descArea);

    const custoLabel = document.createElement('label');
    custoLabel.innerHTML = '<span>Custo estimado de reparação (€)</span>';
    const custoInput = document.createElement('input');
    custoInput.type = 'number';
    custoInput.min = '0';
    custoInput.step = '0.01';
    custoLabel.appendChild(custoInput);

    const respLabel = document.createElement('label');
    respLabel.innerHTML = '<span>Responsabilidade</span>';
    const respSelect = document.createElement('select');
    ['Cliente','Empresa','Terceiro','A apurar'].forEach(s => {
      const o = document.createElement('option'); o.value = s; o.textContent = s; respSelect.appendChild(o);
    });
    respLabel.appendChild(respSelect);

    const fotosLabel = document.createElement('label');
    fotosLabel.className = 'full';
    fotosLabel.innerHTML = '<span>Fotografias do dano (sem limite)</span>';
    const fotosWrap = document.createElement('div');
    // previews de fotos existentes
    if (prefill && Array.isArray(prefill.fotos) && prefill.fotos.length) {
      const prev = document.createElement('div');
      prev.style.display = 'flex'; prev.style.flexWrap = 'wrap'; prev.style.gap = '6px'; prev.style.marginBottom = '8px';
      prefill.fotos.forEach((f) => {
        const img = document.createElement('img');
        img.src = f; img.style.width = '100px'; img.style.height = '80px'; img.style.objectFit = 'cover'; img.style.border = '1px solid var(--border)'; img.style.borderRadius = '4px';
        prev.appendChild(img);
      });
      fotosWrap.appendChild(prev);
      // guardar para submissão
      card._existingFotos = [...prefill.fotos];
    }
    createFotoInputList(fotosWrap);
    fotosLabel.appendChild(fotosWrap);

    const anexosLabel = document.createElement('label');
    anexosLabel.className = 'full';
    anexosLabel.innerHTML = '<span>Anexos adicionais (opcional)</span>';
    const anexInput = document.createElement('input');
    anexInput.type = 'file';
    anexInput.multiple = true;
    anexInput.accept = '*/*';
    anexosLabel.appendChild(anexInput);

    grid.appendChild(header);
    const grid3 = document.createElement('div'); grid3.className = 'grid-3';
    grid3.appendChild(locLabel);
    grid3.appendChild(tipoLabel);
    grid3.appendChild(severLabel);
    grid.appendChild(grid3);
    const grid2 = document.createElement('div'); grid2.className = 'grid-2';
    grid2.appendChild(dimLabel);
    grid2.appendChild(custoLabel);
    grid.appendChild(grid2);
    grid.appendChild(respLabel);
    grid.appendChild(descLabel);
    grid.appendChild(fotosLabel);
    grid.appendChild(anexosLabel);

    card.appendChild(grid);
    danosLista.appendChild(card);

    if (prefill){
      locInput.value = prefill.localizacao || '';
      tipoSelect.value = prefill.tipo || '';
      severSelect.value = prefill.severidade || 'Leve';
      dimInput.value = prefill.dimensao || '';
      descArea.value = prefill.descricao || '';
      custoInput.value = prefill.custoEstimado || prefill.custo || '';
      respSelect.value = prefill.responsabilidade || 'A apurar';
    }
  }

  async function loadContrato(contratoId){
    const snap = await db.ref(`alugueres/${contratoId}`).once('value');
    const c = snap.val();
    if (!c) {
      // Tentar procurar em contratos terminados
      const snapTerminados = await db.ref(`alugueres_terminados/${contratoId}`).once('value');
      const cTerminado = snapTerminados.val();
      if (!cTerminado) {
        alert('Contrato não encontrado');
        window.location.href = 'historico.html';
        return;
      }
      contratoAtual = { _id: contratoId, ...cTerminado };
    } else {
      contratoAtual = { _id: contratoId, ...c };
    }
    
    const contrato = contratoAtual;
    if (contratoIdSpan) contratoIdSpan.textContent = `ID: ${contratoId}`;
    if (clienteNomeSpan) clienteNomeSpan.textContent = contrato.cliente?.nome || '—';
    if (veiculoInfoSpan) {
      const v = contrato.veiculo || {}; 
      veiculoInfoSpan.textContent = `${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
    }
    if (periodoAluguerSpan) {
      const a = contrato.aluguer || {}; 
      periodoAluguerSpan.textContent = `${a.inicio || ''} → ${a.fim || ''}`;
    }
  }

  // Função auxiliar que estava em falta
  async function loadContrato(contratoId){
    try {
      const snap = await db.ref(`alugueres/${contratoId}`).once('value');
      const c = snap.val();
      if (!c) {
        // Tentar procurar em contratos terminados
        const snapTerminados = await db.ref(`alugueres_terminados/${contratoId}`).once('value');
        const cTerminado = snapTerminados.val();
        if (!cTerminado) {
          alert('Contrato não encontrado');
          window.location.href = 'historico.html';
          return;
        }
        contratoAtual = { _id: contratoId, ...cTerminado };
      } else {
        contratoAtual = { _id: contratoId, ...c };
      }
      
      const contrato = contratoAtual;
      if (contratoIdSpan) contratoIdSpan.textContent = `ID: ${contratoId}`;
      if (clienteNomeSpan) clienteNomeSpan.textContent = contrato.cliente?.nome || '—';
      if (veiculoInfoSpan) {
        const v = contrato.veiculo || {}; 
        veiculoInfoSpan.textContent = `${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
      }
      if (periodoAluguerSpan) {
        const a = contrato.aluguer || {}; 
        periodoAluguerSpan.textContent = `${a.inicio || ''} → ${a.fim || ''}`;
      }
    } catch (error) {
      console.error('Erro ao carregar contrato:', error);
      alert('Erro ao carregar contrato');
      return;
    }
  }

  async function processFotosFrom(container){
    const inputs = Array.from(container.querySelectorAll('input[type="file"].danoFoto'));
    const result = [];
    for (const input of inputs){
      const file = input.files && input.files[0];
      if (!file) continue;
      try {
        const dataUrl = await fileToDataURL(file);
        const resized = await resizeImageDataURL(dataUrl, 1280, 1280);
        const sized = await ensureMaxBytesDataURL(resized, 1_200_000);
        result.push(sized);
      } catch(e) { }
    }
    return result;
  }

  async function submit(e){
    e.preventDefault();
    if (!contratoAtual){ alert('Contrato não carregado'); return; }
    try {
      formMsg.hidden = true;

      const danosCards = Array.from(danosLista.querySelectorAll('.card'));
      if (danosCards.length === 0){
        alert('Adicione pelo menos um dano.');
        return;
      }

      const danosPayload = [];
      for (const card of danosCards){
        const loc = card.querySelector('input[type="text"]')?.value?.trim();
        const tipo = card.querySelector('select')?.value || '';
        const selects = Array.from(card.querySelectorAll('select'));
        const severidade = selects[1]?.value || 'Leve';
        const dim = card.querySelector('input[type="text"]:nth-of-type(2)')?.value || '';
        const desc = card.querySelector('textarea')?.value?.trim();
        const custo = parseFloat(card.querySelector('input[type="number"]')?.value || '0') || 0;
        const resp = selects[2]?.value || 'A apurar';

        if (!loc || !tipo || !desc){
          alert('Preencha localização, tipo e descrição em cada dano.');
          return;
        }

        const fotosWrap = card.querySelector('.foto-list')?.parentElement; // o label
        const novas = await processFotosFrom(fotosWrap || card);
        const existentes = Array.isArray(card._existingFotos) ? card._existingFotos : [];
        const fotos = [...existentes, ...novas];

        danosPayload.push({
          id: card.dataset.danoId || uuid(),
          localizacao: loc,
          tipo,
          severidade,
          dimensao: dim,
          descricao: desc,
          custoEstimado: custo,
          responsabilidade: resp,
          fotos,
          criadoEm: new Date().toISOString(),
        });
      }

      // Guardar em /danos/{contratoId}/items, sem limite de fotos
      const user = auth?.currentUser || null;
      const userMeta = { uid: user?.uid || null, email: user?.email || null, nome: (user?.displayName || user?.email || '—') };

      // tentar obter veiculoId pelo contrato ou por matrícula
      let veiculoId = contratoAtual.veiculoId || '';
      if (!veiculoId) {
        try {
          const matriculaContrato = (contratoAtual.veiculo?.matricula || '').trim().toLowerCase();
          if (matriculaContrato) {
            const snapAll = await db.ref('veiculos').once('value');
            const val = snapAll.val() || {};
            for (const [k, v] of Object.entries(val)) {
              const m = (v.matricula || '').trim().toLowerCase();
              if (m && m === matriculaContrato) { veiculoId = k; break; }
            }
          }
        } catch {}
      }

      const dados = {
        contratoId: contratoAtual._id,
        veiculo: contratoAtual.veiculo || null,
        veiculoId: veiculoId || null,
        cliente: contratoAtual.cliente || null,
        aluguer: contratoAtual.aluguer || null,
        items: danosPayload,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: userMeta,
      };

      await db.ref(`danos/${contratoAtual._id}`).set(dados);
      if (window.notifications) window.notifications.success('Danos guardados com sucesso');
      alert('Danos guardados com sucesso');

      // Voltar para receção se vier de lá
      const back = new URLSearchParams(location.search).get('back');
      if (back === 'rececao') {
        window.location.href = `rececao-veiculo.html?id=${encodeURIComponent(contratoAtual._id)}`;
      }
    } catch (err){
      formMsg.textContent = 'Erro ao guardar danos. Tente novamente.';
      formMsg.hidden = false;
    }
  }

  async function init(){
    const params = new URLSearchParams(window.location.search);
    const contratoId = params.get('id');
    const editId = params.get('edit');
    if (!contratoId) {
      alert('ID do contrato não especificado');
      window.location.href = 'historico.html';
      return;
    }
    await loadContrato(contratoId);
    // Carregar danos existentes
    try {
      const snap = await db.ref(`danos/${contratoId}`).once('value');
      const dados = snap.val() || {};
      const items = Array.isArray(dados.items) ? dados.items : [];
      if (items.length) {
        if (editId) {
          const alvo = items.find(d => String(d.id) === String(editId));
          if (alvo) { addDanoItem(alvo); }
          else { items.forEach((d) => addDanoItem(d)); }
        } else {
          items.forEach((d) => addDanoItem(d));
        }
      } else {
        addDanoItem();
      }
    } catch { addDanoItem(); }

    addDanoBtn?.addEventListener('click', () => addDanoItem());
    form.addEventListener('submit', submit);
    voltarRececao?.addEventListener('click', (e) => {
      e.preventDefault();
      const back = params.get('back');
      if (back === 'gerir-danos') {
        const url = new URL('gerir-danos.html', location.origin);
        const veiculoId = params.get('veiculoId'); if (veiculoId) url.searchParams.set('veiculoId', veiculoId);
        window.location.href = url.toString();
      } else {
        window.location.href = `rececao-veiculo.html?id=${encodeURIComponent(contratoId)}`;
      }
    });

    // Se vier pre-preenchido via query (ex.: texto de danosIdentificados)
    const pre = params.get('prefill');
    if (pre) {
      try {
        const obj = JSON.parse(pre);
        if (Array.isArray(obj) && obj.length) {
          obj.forEach((d) => addDanoItem(d));
        } else if (typeof obj === 'object') {
          addDanoItem(obj);
        }
      } catch {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Compressão automática reutiliza handler de .veicFoto definido em rececaoVeiculo.js

