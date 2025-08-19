(function initTerminados(){
  const listDiv = document.getElementById('listaTerminados');
  const search = document.getElementById('search');
  if (!listDiv || !search) return;

  let todos = [];

  const render = (items) => {
    listDiv.innerHTML = '';
    if (!items.length) {
      listDiv.innerHTML = '<p class="muted">Sem resultados.</p>';
      return;
    }
    for (const item of items) {
      const div = document.createElement('div');
      div.className = 'list-item';
      const c = item.cliente || {}; const v = item.veiculo || {}; const a = item.aluguer || {};
      const titulo = `${c.nome || '—'} • ${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
      const periodo = `${a.inicio || ''} → ${a.fim || ''}`;

      const temPdfRececao = !!(item.rececao && item.rececao.pdfBase64);
      const autorLinha = item.criadoPor?.nome || item.criadoPor?.email ? `<span class="muted">Criado por: ${item.criadoPor?.nome || item.criadoPor?.email}</span>` : '';
      div.innerHTML = `
        <strong>${titulo}</strong>
        <span>${periodo}</span>
        ${autorLinha}
        <div style="display:flex; gap:8px; flex-wrap: wrap;">
          <button class="btn" data-view="${item._id}">Ver PDF</button>
          ${temPdfRececao ? `<button class="btn" data-rececao="${item._id}">PDF de Receção</button>` : ''}
          <button class="btn" data-restore="${item._id}">Reabrir</button>
          <button class="btn danger" data-delete="${item._id}">Eliminar</button>
        </div>
      `;
      listDiv.appendChild(div);

      const btnView = div.querySelector('[data-view]');
      btnView.addEventListener('click', async () => {
        try {
          // Verificar se jsPDF está disponível
          if (typeof window.jspdf === 'undefined' || !window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF não está disponível');
          }

          // Verificar se pdfUtils está disponível
          if (typeof window.pdfUtils === 'undefined' || !window.pdfUtils) {
            throw new Error('pdfUtils não está disponível');
          }

          // Verificar se gerarContratoPDF está disponível
          if (typeof gerarContratoPDF !== 'function') {
            throw new Error('Função gerarContratoPDF não está disponível');
          }

          const dataUri = await gerarContratoPDF({ id: item._id, ...item });
          const blob = window.pdfUtils.dataUriToBlob(dataUri);
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank', 'noopener');
          setTimeout(() => URL.revokeObjectURL(url), 30000);
        } catch (e) {
          alert(`Erro ao gerar PDF: ${e.message || 'Não foi possível gerar o PDF agora.'}`);
        }
      });

      const btnRececao = div.querySelector('[data-rececao]');
      if (btnRececao) {
        btnRececao.addEventListener('click', async () => {
          // Tentar regenerar o PDF de receção com fotos de danos em tempo real; caso falhe, usar o PDF guardado
          const id = item._id;
          try {
            if (typeof window.jspdf === 'undefined' || !window.jspdf || !window.jspdf.jsPDF) {
              throw new Error('jsPDF não está disponível');
            }
            if (typeof gerarRececaoPDF !== 'function') {
              throw new Error('Função gerarRececaoPDF não está disponível');
            }

            // Carregar danos e normalizar fotos para JPEG
            let danosDetalhados = [];
            try {
              const snap = await db.ref(`danos/${id}`).once('value');
              const d = snap.val();
              const items = Array.isArray(d?.items) ? d.items : [];
              for (const it of items) {
                const fotosSrc = Array.isArray(it.fotos) ? it.fotos : [];
                const fotosJpeg = [];
                for (const f of fotosSrc) {
                  try { fotosJpeg.push(await resizeImageDataURL(f, 1280, 1280)); } catch { fotosJpeg.push(f); }
                }
                danosDetalhados.push({
                  id: it.id || (typeof uuid === 'function' ? uuid() : String(Date.now())),
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
            } catch {}

            const payload = { id, ...item, rececao: { ...(item.rececao || {}), danosDetalhados } };
            const dataUri = await gerarRececaoPDF(payload);
            const blob = window.pdfUtils && typeof window.pdfUtils.dataUriToBlob === 'function'
              ? window.pdfUtils.dataUriToBlob(dataUri)
              : (function dataUriToBlobLocal(dataUriStr){
                  const parts = dataUriStr.split(','); const base64 = (parts[1]||'').replace(/\s+/g,'');
                  const bin = atob(base64); const len = bin.length; const bytes = new Uint8Array(len);
                  for (let i=0;i<len;i++) bytes[i] = bin.charCodeAt(i);
                  const mimeMatch = (parts[0]||'').match(/data:(.*?);base64/); const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
                  return new Blob([bytes], { type: mime });
                })(dataUri);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener');
            setTimeout(() => URL.revokeObjectURL(url), 30000);
          } catch (e) {
            try {
              if (typeof window.pdfUtils === 'undefined' || !window.pdfUtils) {
                throw new Error('pdfUtils não está disponível');
              }
              const base64 = item?.rececao?.pdfBase64;
              if (!base64) throw new Error('Sem PDF de receção guardado');
              const dataUri = base64.startsWith('data:') ? base64 : `data:application/pdf;base64,${base64}`;
              const blob = window.pdfUtils.dataUriToBlob(dataUri);
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank', 'noopener');
              setTimeout(() => URL.revokeObjectURL(url), 30000);
            } catch (err2) {
              alert(`Erro ao abrir PDF de receção: ${err2.message || 'Não foi possível abrir o PDF de receção.'}`);
            }
          }
        });
      }

      const btnRestore = div.querySelector('[data-restore]');
      btnRestore.addEventListener('click', async () => {
        const confirmar = confirm('Reabrir este contrato e voltar a ativos?');
        if (!confirmar) return;
        try {
          btnRestore.disabled = true;
          const id = item._id;
          const copia = JSON.parse(JSON.stringify(item));
          delete copia._id;
          if (copia.aluguer) {
            delete copia.aluguer.estado;
            delete copia.aluguer.terminadoEm;
          }
          const user = auth?.currentUser || null;
          const userMeta = { uid: user?.uid || null, email: user?.email || null, nome: (user?.displayName || user?.email || '—') };
          copia.reabertoPor = userMeta;
          copia.reabertoEm = new Date().toISOString();
          await db.ref().update({
            [`alugueres/${id}`]: copia,
            [`alugueres_terminados/${id}`]: null
          });
          alert('Contrato reaberto para ativos.');
        } catch (e) {
          alert('Não foi possível reabrir agora.');
        } finally {
          btnRestore.disabled = false;
        }
      });

      const btnDelete = div.querySelector('[data-delete]');
      btnDelete.addEventListener('click', async () => {
        const confirmar = confirm('Eliminar definitivamente este contrato terminado?');
        if (!confirmar) return;
        try {
          btnDelete.disabled = true;
          const user = auth?.currentUser || null;
          const userMeta = { uid: user?.uid || null, email: user?.email || null, nome: (user?.displayName || user?.email || '—') };
          const agoraIso = new Date().toISOString();
          await db.ref(`auditoria/terminados_removidos/${item._id}`).set({ ...item, removidoPor: userMeta, removidoEm: agoraIso });
          await db.ref(`alugueres_terminados/${item._id}`).remove();
          alert('Contrato eliminado.');
        } catch (e) {
          alert('Não foi possível eliminar agora.');
        } finally {
          btnDelete.disabled = false;
        }
      });
    }
  };

  const filtrar = () => {
    const q = search.value.toLowerCase();
    const res = todos.filter((x) => {
      const c = x.cliente || {}; const v = x.veiculo || {}; const a = x.aluguer || {};
      return (
        (c.nome || '').toLowerCase().includes(q) ||
        (v.matricula || '').toLowerCase().includes(q) ||
        (a.inicio || '').toLowerCase().includes(q) ||
        (a.fim || '').toLowerCase().includes(q) ||
        (v.marca || '').toLowerCase().includes(q) ||
        (v.modelo || '').toLowerCase().includes(q)
      );
    });
    render(res);
  };

  search.addEventListener('input', filtrar);

  protectPage();
  let ref = null; let cb = null;
  auth.onAuthStateChanged((user) => {
    if (!user) return;
    ref = db.ref('alugueres_terminados');
    cb = (snap) => {
      const val = snap.val() || {};
      todos = Object.entries(val).map(([k, v]) => ({ _id: k, ...v }));
      filtrar();
    };
    ref.on('value', cb);
  });

  const cleanup = () => { try { if (ref && cb) ref.off('value', cb); } catch {} };
  window.addEventListener('beforeunload', cleanup);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cleanup(); });
})();

