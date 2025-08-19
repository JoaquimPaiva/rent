(function initVeiculos() {
  // Seleção de elementos com verificações
  const getElement = (id) => document.getElementById(id) || null;
  
  const listDiv = getElement('listaVeiculos');
  const search = getElement('search');
  const btnAddVeiculo = getElement('btnAddVeiculo');
  const form = getElement('veiculoForm');
  const formTitle = getElement('formTitle');
  const btnAddFoto = getElement('btnAddFoto');
  const fotosWrap = getElement('fotosWrap');
  const btnGuardar = getElement('btnGuardar');
  const btnCancelar = getElement('btnCancelar');
  const formMsg = getElement('formMsg');
  const veiculoModal = getElement('veiculoModal');
  const veiculoModalClose = getElement('veiculoModalClose');

  // Verificação inicial de elementos essenciais
  if (!listDiv || !search || !btnAddVeiculo || !form) {
    console.error('Elementos essenciais não encontrados no DOM');
    return;
  }

  // Definir a função fileToDataURL no escopo da função principal
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
  
  // Adicionar também a função resizeImageDataURL
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

  // Adicionar também a função uuid
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

  let todos = [];
  let editId = null;

  const fecharModalForm = () => {
    if (veiculoModal) {
      veiculoModal.style.display = 'none';
      veiculoModal.setAttribute('aria-hidden', 'true');
    }
    form.reset?.();
    if (formMsg) formMsg.hidden = true;
    editId = null;
  };

  const abrirModalForm = (title = 'Adicionar veículo') => {
    if (formTitle) formTitle.textContent = title;
    if (veiculoModal) {
      veiculoModal.style.display = 'flex';
      veiculoModal.setAttribute('aria-hidden', 'false');
    }
  };

  const createFotoInput = (shouldAutoOpen = false) => {
    if (!fotosWrap) return null;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.className = 'veicFoto';
    fotosWrap.appendChild(input);
    if (shouldAutoOpen) { try { input.click(); } catch { } }
    return input;
  };

  // Adicionar event listeners somente se os elementos existirem
  if (btnAddFoto) btnAddFoto.addEventListener('click', () => createFotoInput(true));
  if (btnCancelar) btnCancelar.addEventListener('click', fecharModalForm);
  btnAddVeiculo.addEventListener('click', () => { abrirModalForm('Adicionar veículo'); });
  if (veiculoModalClose) veiculoModalClose.addEventListener('click', fecharModalForm);
  if (veiculoModal) veiculoModal.addEventListener('click', (e) => { if (e.target === veiculoModal) fecharModalForm(); });

  const render = (items) => {
    listDiv.innerHTML = '';
    if (!items.length) {
      listDiv.innerHTML = '<p class="muted">Sem resultados.</p>';
      return;
    }
    for (const item of items) {
      const div = document.createElement('div');
      div.className = 'list-item';
      const v = item || {};
      const titulo = `${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
      const detalhes = `${v.cor || ''} • ${Number.isFinite(v.quilometragem) ? v.quilometragem + ' km' : ''} • ${v.combustivel || ''}`;
      div.innerHTML = `
        <strong>${titulo}</strong>
        <span>${detalhes}</span>
        <div style="display:flex; gap:8px; flex-wrap: wrap;">
          <button class="btn" data-usar="${item._id}">Usar no aluguer</button>
          <button class="btn" data-orcamento="${item._id}">Criar orçamento</button>
          <button class="btn" data-estado="${item._id}">Ver estado</button>
          <button class="btn" data-danos="${item._id}">Gerir danos</button>
          <button class="btn" data-editar="${item._id}">Editar</button>
          <button class="btn danger" data-remover="${item._id}">Remover</button>
        </div>
      `;
      listDiv.appendChild(div);

      div.querySelector('[data-usar]')?.addEventListener('click', () => {
        window.location.href = `novo-aluguer.html?veiculoId=${item._id}`;
      });
      div.querySelector('[data-orcamento]')?.addEventListener('click', () => {
        window.location.href = `criar-orcamento.html?veiculoId=${item._id}`;
      });
      div.querySelector('[data-editar]')?.addEventListener('click', () => editar(item));
      div.querySelector('[data-remover]')?.addEventListener('click', () => remover(item));
      div.querySelector('[data-estado]')?.addEventListener('click', () => verEstado(item));
      div.querySelector('[data-danos]')?.addEventListener('click', () => {
        // abrir gestão de danos filtrada pelo veículo
        window.location.href = `gerir-danos.html?veiculoId=${item._id}`;
      });
    }
  };

  const filtrar = () => {
    const q = search.value.toLowerCase();
    const res = todos.filter((v) =>
      (v.matricula || '').toLowerCase().includes(q) ||
      (v.marca || '').toLowerCase().includes(q) ||
      (v.modelo || '').toLowerCase().includes(q)
    );
    render(res);
  };
  search.addEventListener('input', filtrar);

  const lerForm = async () => {
    const matricula = document.getElementById('fMatricula').value.trim();
    const marca = document.getElementById('fMarca').value.trim();
    const modelo = document.getElementById('fModelo').value.trim();
    const cor = document.getElementById('fCor').value.trim();
    const quilometragem = Number(document.getElementById('fKm').value);
    const anoVal = Number(document.getElementById('fAno').value || '');
    const vin = document.getElementById('fVin').value.trim();
    const combustivel = document.getElementById('fCombustivel').value;
    const nivelCombustivel = `${document.getElementById('fNivelComb').value}%`;
    const estado = document.getElementById('fEstadoTexto').value.trim();
    const estadoChecklist = {
      pneus: document.getElementById('fEstadoPneus').checked,
      pintura: document.getElementById('fEstadoPintura').checked,
      vidros: document.getElementById('fEstadoVidros').checked,
      interior: document.getElementById('fEstadoInterior').checked,
      luzes: document.getElementById('fEstadoLuzes').checked,
    };

    if (!matricula || !marca || !modelo || !cor || !Number.isFinite(quilometragem)) {
      throw new Error('Preenche os campos obrigatórios.');
    }

    const fileInputs = Array.from(document.querySelectorAll('#fotosWrap .veicFoto'));
    const fotos = Array.from(fotosWrap.querySelectorAll('img')).map(img => img.src);
    for (const input of fileInputs) {
      const file = input.files && input.files[0];
      if (!file) continue;
      const dataUrl = await fileToDataURL(file);
      const resized = await resizeImageDataURL(dataUrl, 1280, 1280);
      fotos.push(resized);
    }

    return {
      matricula, marca, modelo, cor,
      quilometragem: Number.isFinite(quilometragem) ? quilometragem : 0,
      ano: Number.isFinite(anoVal) ? anoVal : undefined,
      vin: vin || undefined,
      combustivel: combustivel || undefined,
      nivelCombustivel,
      estado,
      estadoChecklist,
      fotos,
    };
  };

  const limparForm = () => {
    form.reset?.();
    fotosWrap.innerHTML = '<input type="file" class="veicFoto" accept="image/*" capture="environment" />';
    formMsg.hidden = true;
  };

  const editar = (item) => {
    editId = item._id;
    abrirModalForm('Editar veículo');
    document.getElementById('fMatricula').value = item.matricula || '';
    document.getElementById('fMarca').value = item.marca || '';
    document.getElementById('fModelo').value = item.modelo || '';
    document.getElementById('fCor').value = item.cor || '';
    document.getElementById('fKm').value = item.quilometragem || '';
    document.getElementById('fAno').value = item.ano || '';
    document.getElementById('fVin').value = item.vin || '';
    document.getElementById('fCombustivel').value = item.combustivel || '';
    document.getElementById('fNivelComb').value = item.nivelCombustivel ? parseInt(String(item.nivelCombustivel).replace('%', '')) : 75;
    document.getElementById('fEstadoTexto').value = item.estado || '';
    document.getElementById('fEstadoPneus').checked = !!(item.estadoChecklist?.pneus);
    document.getElementById('fEstadoPintura').checked = !!(item.estadoChecklist?.pintura);
    document.getElementById('fEstadoVidros').checked = !!(item.estadoChecklist?.vidros);
    document.getElementById('fEstadoInterior').checked = !!(item.estadoChecklist?.interior);
    document.getElementById('fEstadoLuzes').checked = !!(item.estadoChecklist?.luzes);

    // fotos existentes com opção de remover
    fotosWrap.innerHTML = '';
    (item.fotos || []).forEach((foto) => {
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
      fotosWrap.appendChild(fotoContainer);
    });
    createFotoInput(false);
  };

  const remover = async (item) => {
    const confirmar = confirm('Remover este veículo?');
    if (!confirmar) return;
    try {
      const user = auth?.currentUser || null;
      const userMeta = { uid: user?.uid || null, email: user?.email || null, nome: (user?.displayName || user?.email || '—') };
      const agoraIso = new Date().toISOString();
      await db.ref(`veiculos/${item._id}`).remove();
      await db.ref(`auditoria/veiculos_removidos/${item._id}`).set({
        ...item,
        removidoPor: userMeta,
        removidoEm: agoraIso
      });
    } catch (e) {
      alert('Não foi possível remover agora.');
    }
  };

  // Modal: Ver estado
  const estadoModal = document.getElementById('estadoModal');
  const estadoModalBody = document.getElementById('estadoModalBody');
  const estadoModalClose = document.getElementById('estadoModalClose');

  const abrirModal = () => { if (estadoModal) { estadoModal.style.display = 'flex'; estadoModal.setAttribute('aria-hidden', 'false'); } };
  const fecharModal = () => { if (estadoModal) { estadoModal.style.display = 'none'; estadoModal.setAttribute('aria-hidden', 'true'); } };
  estadoModalClose?.addEventListener('click', fecharModal);
  estadoModal?.addEventListener('click', (e) => { if (e.target === estadoModal) fecharModal(); });

  const verEstado = (item) => {
    if (!estadoModalBody) return;
    const v = item || {};
    const checklist = v.estadoChecklist || {};
    const fotos = Array.isArray(v.fotos) ? v.fotos : [];
    const fotosHtml = fotos.map((f) => `<img src="${f}" style="width:110px;height:80px;object-fit:cover;border:1px solid var(--border);border-radius:4px;margin:4px;" />`).join('');

    estadoModalBody.innerHTML = `
      <div class="info-card">
        <strong>${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})</strong>
        <p>${v.cor || ''} • ${v.combustivel || ''} • ${Number.isFinite(v.ano) ? v.ano : ''}</p>
        <p>${Number.isFinite(v.quilometragem) ? v.quilometragem + ' km' : ''} • ${v.nivelCombustivel || ''}</p>
      </div>
      <div class="info-card">
        <p><strong>Estado geral:</strong> ${v.estado || '—'}</p>
        <p><strong>Checklist:</strong>
          Pneus: ${check(checklist.pneus)} | Pintura: ${check(checklist.pintura)} | Vidros: ${check(checklist.vidros)} | Interior: ${check(checklist.interior)} | Luzes: ${check(checklist.luzes)}
        </p>
      </div>
      <div class="info-card">
        <p><strong>Fotografias:</strong></p>
        <div style="display:flex;flex-wrap:wrap;">${fotosHtml || '<span class="muted">—</span>'}</div>
      </div>
    `;
    abrirModal();
  };

  const check = (val) => val ? 'OK' : 'Não OK';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = btnGuardar;
    try {
      if (submitBtn) submitBtn.disabled = true;
      formMsg.hidden = true;
      const veiculo = await lerForm();
      const user = auth?.currentUser || null;
      const userMeta = { uid: user?.uid || null, email: user?.email || null, nome: (user?.displayName || user?.email || '—') };
      const agoraIso = new Date().toISOString();
      if (editId) {
        await db.ref(`veiculos/${editId}`).update({
          ...veiculo,
          atualizadoPor: userMeta,
          atualizadoEm: agoraIso
        });
      } else {
        const id = uuid();
        await db.ref(`veiculos/${id}`).set({
          ...veiculo,
          criadoPor: userMeta,
          criadoEm: agoraIso
        });
      }
      formMsg.textContent = 'Guardado com sucesso!';
      formMsg.hidden = false;
      limparForm();
      fecharModalForm();
    } catch (err) {
      formMsg.textContent = 'Erro ao guardar: ' + (err?.message || 'tenta novamente.');
      formMsg.hidden = false;
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Live load com cleanup
  protectPage();
  let ref = null; let cb = null;
  auth.onAuthStateChanged((user) => {
    if (!user) return;
    ref = db.ref('veiculos');
    cb = (snap) => {
      const val = snap.val() || {};
      todos = Object.entries(val).map(([k, v]) => ({ _id: k, ...v }));
      filtrar();
    };
    ref.on('value', cb);
  });

  const cleanup = () => { try { if (ref && cb) ref.off('value', cb); } catch { } };
  window.addEventListener('beforeunload', cleanup);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cleanup(); });
})();

// Adicionar funcionalidade de filtros avançados
function initAdvancedFilters() {
  const toggleFilters = document.getElementById('toggleFilters');
  const filtersPanel = document.getElementById('filtersPanel');
  const filterIcon = document.getElementById('filterIcon');
  const clearFilters = document.getElementById('clearFilters');
  const applyFilters = document.getElementById('applyFilters');

  let filtersVisible = false;
  let activeFilters = {};

  // Toggle dos filtros
  toggleFilters?.addEventListener('click', () => {
    filtersVisible = !filtersVisible;
    filtersPanel.style.display = filtersVisible ? 'block' : 'none';
    filterIcon.textContent = filtersVisible ? '🔽' : '🔍';
  });

  // Limpar filtros
  clearFilters?.addEventListener('click', () => {
    document.getElementById('filterMarca').value = '';
    document.getElementById('filterCombustivel').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterAnoMin').value = '';
    document.getElementById('filterKmMax').value = '';
    activeFilters = {};
    updateResultsInfo();
    filterVehicles();
  });

  // Aplicar filtros
  applyFilters?.addEventListener('click', () => {
    activeFilters = {
      marca: document.getElementById('filterMarca').value,
      combustivel: document.getElementById('filterCombustivel').value,
      estado: document.getElementById('filterEstado').value,
      anoMin: document.getElementById('filterAnoMin').value,
      kmMax: document.getElementById('filterKmMax').value
    };

    updateResultsInfo();
    filterVehicles();
  });

  // Função para atualizar informações dos resultados
  function updateResultsInfo() {
    let resultsInfo = document.getElementById('resultsInfo');
    if (!resultsInfo) {
      resultsInfo = document.createElement('div');
      resultsInfo.id = 'resultsInfo';
      resultsInfo.className = 'results-info';
      document.getElementById('listaVeiculos').parentNode.insertBefore(resultsInfo, document.getElementById('listaVeiculos'));
    }

    const filteredCount = document.querySelectorAll('#listaVeiculos .list-item:not([style*="display: none"])').length;
    const totalCount = document.querySelectorAll('#listaVeiculos .list-item').length;

    const activeFilterTags = Object.entries(activeFilters)
      .filter(([, value]) => value)
      .map(([key, value]) => {
        const labels = {
          marca: 'Marca',
          combustivel: 'Combustível',
          estado: 'Estado',
          anoMin: 'Ano min.',
          kmMax: 'Km max.'
        };
        return `
          <span class="filter-tag">
            ${labels[key]}: ${value}
            <span class="remove" onclick="removeFilter('${key}')">×</span>
          </span>
        `;
      }).join('');

    resultsInfo.innerHTML = `
      <div class="results-count">
        Mostrando ${filteredCount} de ${totalCount} veículos
      </div>
      <div class="active-filters">
        ${activeFilterTags}
      </div>
    `;
  }

  // Função para filtrar veículos
  function filterVehicles() {
    const vehicles = document.querySelectorAll('#listaVeiculos .list-item');

    vehicles.forEach(vehicle => {
      let show = true;

      // Filtro por marca
      if (activeFilters.marca) {
        const marca = vehicle.querySelector('[data-marca]')?.getAttribute('data-marca') || '';
        if (marca.toLowerCase() !== activeFilters.marca.toLowerCase()) {
          show = false;
        }
      }

      // Filtro por combustível
      if (activeFilters.combustivel && show) {
        const combustivel = vehicle.querySelector('[data-combustivel]')?.getAttribute('data-combustivel') || '';
        if (combustivel !== activeFilters.combustivel) {
          show = false;
        }
      }

      // Filtro por estado
      if (activeFilters.estado && show) {
        const estado = vehicle.querySelector('[data-estado]')?.getAttribute('data-estado') || '';
        if (estado !== activeFilters.estado) {
          show = false;
        }
      }

      // Filtro por ano mínimo
      if (activeFilters.anoMin && show) {
        const ano = parseInt(vehicle.querySelector('[data-ano]')?.getAttribute('data-ano') || '0');
        if (ano < parseInt(activeFilters.anoMin)) {
          show = false;
        }
      }

      // Filtro por quilometragem máxima
      if (activeFilters.kmMax && show) {
        const km = parseInt(vehicle.querySelector('[data-km]')?.getAttribute('data-km') || '0');
        if (km > parseInt(activeFilters.kmMax)) {
          show = false;
        }
      }

      vehicle.style.display = show ? '' : 'none';
    });

    updateResultsInfo();
  }

  // Função global para remover filtro individual
  window.removeFilter = function (key) {
    delete activeFilters[key];
    document.getElementById(`filter${key.charAt(0).toUpperCase() + key.slice(1)}`).value = '';
    filterVehicles();
  };

  // Popular filtro de marcas dinamicamente
  function populateMarcaFilter() {
    const marcaSelect = document.getElementById('filterMarca');
    if (!marcaSelect) return;

    const marcas = new Set();
    document.querySelectorAll('[data-marca]').forEach(el => {
      const marca = el.getAttribute('data-marca');
      if (marca) marcas.add(marca);
    });

    // Adicionar opções de marca
    Array.from(marcas).sort().forEach(marca => {
      const option = document.createElement('option');
      option.value = marca;
      option.textContent = marca;
      marcaSelect.appendChild(option);
    });
  }

  // Chamar quando a lista de veículos for atualizada
  setTimeout(populateMarcaFilter, 1000);
}

// Inicializar filtros quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initAdvancedFilters);

