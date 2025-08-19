(function initGerirDanos(){
  const lista = document.getElementById('listaDanos');
  const search = document.getElementById('search');
  const veicInfo = document.getElementById('veicInfo');
  const voltarBtn = document.getElementById('btnVoltarVeiculo');

  if (!lista || !search) return;

  const params = new URLSearchParams(location.search);
  const veiculoId = params.get('veiculoId') || '';
  let veiculoAlvo = null;

  let todos = [];
  let veiculosCache = {};

  const goBack = () => window.location.href = 'veiculos.html';
  voltarBtn?.addEventListener('click', goBack);

  const render = (items) => {
    lista.innerHTML = '';
    if (!items.length) {
      lista.innerHTML = '<p class="muted">Sem danos por mostrar.</p>';
      return;
    }
    for (const it of items){
      const v = it._veiculo || {};
      const h = document.createElement('div');
      h.className = 'list-item';
      const fotosHtml = (Array.isArray(it.fotos) ? it.fotos : []).map((f) => `<img src="${f}" style="width:100px;height:80px;object-fit:cover;border:1px solid var(--border);border-radius:4px;"/>`).join('');
      h.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <div>
            <strong>${it.tipo || 'Dano'} em ${it.localizacao || '—'}</strong>
            <div class="muted">Severidade: ${it.severidade || 'Leve'} ${it.dimensao ? ' • ' + it.dimensao : ''}</div>
            <div class="muted">Contrato: ${it.contratoId || '—'} • Veículo: ${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})</div>
            ${it.descricao ? `<div>${it.descricao}</div>` : ''}
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn" data-editar="${it._key}">Editar dano</button>
            <button class="btn" data-resolver="${it._key}">Marcar resolvido</button>
            <button class="btn danger" data-remover="${it._key}">Remover</button>
          </div>
        </div>
        <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">${fotosHtml}</div>
      `;
      lista.appendChild(h);

      h.querySelector(`[data-editar="${it._key}"]`)?.addEventListener('click', () => editar(it));
      h.querySelector(`[data-remover="${it._key}"]`)?.addEventListener('click', () => remover(it));
      h.querySelector(`[data-resolver="${it._key}"]`)?.addEventListener('click', () => resolver(it));
    }
  };

  const filtrar = () => {
    const q = (search.value || '').toLowerCase();
    const arr = todos.filter(d => (
      (d.tipo || '').toLowerCase().includes(q) ||
      (d.localizacao || '').toLowerCase().includes(q) ||
      (d.descricao || '').toLowerCase().includes(q) ||
      (d.contratoId || '').toLowerCase().includes(q) ||
      (d._veiculo?.matricula || '').toLowerCase().includes(q)
    ));
    render(arr);
  };
  search.addEventListener('input', filtrar);

  const loadVeic = async (id) => {
    if (!id) return null;
    if (veiculosCache[id]) return veiculosCache[id];
    const snap = await db.ref(`veiculos/${id}`).once('value');
    veiculosCache[id] = snap.val() || null;
    return veiculosCache[id];
  };

  const carregar = async () => {
    const snap = await db.ref('danos').once('value');
    const val = snap.val() || {};
    const out = [];
    for (const [contratoId, dados] of Object.entries(val)){
      const items = Array.isArray(dados.items) ? dados.items : [];
      for (const item of items){
        const key = `${contratoId}:${item.id || Math.random().toString(36).slice(2)}`;
        const linha = { _key: key, contratoId, ...item };
        if (dados.veiculo?.matricula) linha._veiculo = dados.veiculo;
        if (dados.veiculoId) linha._veiculoId = dados.veiculoId;
        if (!linha._veiculo && linha._veiculoId) {
          try { linha._veiculo = await loadVeic(linha._veiculoId); } catch {}
        }
        out.push(linha);
      }
    }
    // se filtrar por veiculoId (query)
    let filtrado = out;
    if (veiculoId) {
      // carregar info do veículo alvo e mostrar cabeçalho
      try { veiculoAlvo = await loadVeic(veiculoId); } catch {}
      if (veicInfo && veiculoAlvo) {
        const v = veiculoAlvo; veicInfo.textContent = `${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
      } else if (veicInfo) {
        veicInfo.textContent = '—';
      }

      filtrado = out.filter(d => (d._veiculoId || '') === veiculoId);
      // fallback por matrícula caso danos não tenham veiculoId
      if ((!filtrado || filtrado.length === 0) && veiculoAlvo && veiculoAlvo.matricula) {
        const mat = (veiculoAlvo.matricula || '').trim().toLowerCase();
        filtrado = out.filter(d => ((d._veiculo?.matricula || '').trim().toLowerCase()) === mat);
      }
    } else {
      // sem filtro, mostrar cabeçalho do primeiro veículo se existir
      if (veicInfo) {
        const anyV = out.find(x => x._veiculo) || null;
        if (anyV) {
          const v = anyV._veiculo; veicInfo.textContent = `${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
        } else { veicInfo.textContent = '—'; }
      }
    }

    todos = filtrado;
    filtrar();
  };

  const remover = async (it) => {
    const ok = confirm('Remover este dano?');
    if (!ok) return;
    try {
      const snap = await db.ref(`danos/${it.contratoId}`).once('value');
      const dados = snap.val() || {};
      const items = Array.isArray(dados.items) ? dados.items : [];
      const novo = items.filter(x => x.id !== it.id);
      await db.ref(`danos/${it.contratoId}`).update({ items: novo });
      await carregar();
    } catch (e) {
      alert('Não foi possível remover agora.');
    }
  };

  const editar = (it) => {
    const url = new URL('danos.html', location.origin);
    url.searchParams.set('id', it.contratoId);
    url.searchParams.set('edit', it.id);
    url.searchParams.set('back', 'gerir-danos');
    if (veiculoId) url.searchParams.set('veiculoId', veiculoId);
    window.location.href = url.toString();
  };

  const resolver = async (it) => {
    const ok = confirm('Marcar como resolvido? Será removido da lista.');
    if (!ok) return;
    try {
      const snap = await db.ref(`danos/${it.contratoId}`).once('value');
      const dados = snap.val() || {};
      const items = Array.isArray(dados.items) ? dados.items : [];
      const novo = items.filter(x => x.id !== it.id);
      await db.ref(`danos/${it.contratoId}`).update({ items: novo, atualizadoEm: new Date().toISOString() });
      await carregar();
    } catch (e) {
      alert('Não foi possível marcar como resolvido agora.');
    }
  };

  // init
  protectPage();
  auth.onAuthStateChanged((u) => { if (u) carregar(); });
})();

