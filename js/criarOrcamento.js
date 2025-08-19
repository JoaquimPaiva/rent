(function initCriarOrcamento(){
  const formWrap = document.getElementById('orcamentoForm');
  if (!formWrap) return;

  const selVeiculo = document.getElementById('selVeiculo');
  const vCard = document.getElementById('veiculoCard');
  const vTitulo = document.getElementById('vTitulo');
  const vLinha1 = document.getElementById('vLinha1');
  const vLinha2 = document.getElementById('vLinha2');
  const msg = document.getElementById('msg');
  const btnGerar = document.getElementById('btnGerar');
  const btnValidar = document.getElementById('btnValidar');
  const lblSubtotal = document.getElementById('lblSubtotal');
  const lblTotal = document.getElementById('lblTotal');

  const inputs = {
    cliNome: document.getElementById('cliNome'),
    cliNif: document.getElementById('cliNif'),
    cliContacto: document.getElementById('cliContacto'),
    cliEmail: document.getElementById('cliEmail'),
    cliMorada: document.getElementById('cliMorada'),
    inicio: document.getElementById('orcInicio'),
    fim: document.getElementById('orcFim'),
    precoDiario: document.getElementById('orcPrecoDiario'),
    extras: document.getElementById('orcExtras'),
    desconto: document.getElementById('orcDesconto'),
    caucao: document.getElementById('orcCaucao'),
    obs: document.getElementById('orcObs'),
  };

  let veiculos = [];
  let veiculoSelecionado = null;

  // Função para calcular dias entre duas datas
  function calcularDias(inicio, fim) {
    if (!inicio || !fim) return 0;
    
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    
    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) return 0;
    
    const diffTime = dataFim.getTime() - dataInicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  function atualizarTotais(){
    const d = calcularDias(inputs.inicio.value, inputs.fim.value);
    const pd = Number(inputs.precoDiario.value || 0);
    const ex = Number(inputs.extras.value || 0);
    const de = Number(inputs.desconto.value || 0);
    
    const subtotal = d * pd;
    const total = subtotal + ex - de;
    
    if (lblSubtotal) lblSubtotal.textContent = `${subtotal.toFixed(2)} €`;
    if (lblTotal) lblTotal.textContent = `${Math.max(0, total).toFixed(2)} €`;
    
    // Atualizar label de dias
    const lblDias = document.getElementById('lblDias');
    if (lblDias) lblDias.textContent = d > 0 ? `${d}` : '—';
  }

  // Event listeners para atualizar totais quando as datas ou preços mudarem
  ['change','input'].forEach(evt => {
    if (inputs.inicio) inputs.inicio.addEventListener(evt, () => {
      atualizarTotais();
      validarDatas();
    });
    if (inputs.fim) inputs.fim.addEventListener(evt, () => {
      atualizarTotais();
      validarDatas();
    });
    if (inputs.precoDiario) inputs.precoDiario.addEventListener(evt, atualizarTotais);
    if (inputs.extras) inputs.extras.addEventListener(evt, atualizarTotais);
    if (inputs.desconto) inputs.desconto.addEventListener(evt, atualizarTotais);
  });

  // Função para validar datas
  function validarDatas() {
    const inicio = inputs.inicio.value;
    const fim = inputs.fim.value;
    
    if (inicio && fim) {
      const dataInicio = new Date(inicio);
      const dataFim = new Date(fim);
      
      if (dataFim <= dataInicio) {
        if (inputs.fim) {
          inputs.fim.setCustomValidity('A data de fim deve ser posterior à data de início');
          inputs.fim.reportValidity();
        }
        return false;
      } else {
        if (inputs.fim) {
          inputs.fim.setCustomValidity('');
        }
        return true;
      }
    }
    return true;
  }

  // Função para validar formulário completo
  function validarFormulario() {
    let valido = true;
    const erros = [];

    if (!inputs.cliNome.value.trim()) {
      erros.push('Nome do cliente é obrigatório');
      valido = false;
    }
    if (!inputs.inicio.value) {
      erros.push('Data de início é obrigatória');
      valido = false;
    }
    if (!inputs.fim.value) {
      erros.push('Data de fim é obrigatória');
      valido = false;
    }
    if (!inputs.precoDiario.value || Number(inputs.precoDiario.value) <= 0) {
      erros.push('Preço diário deve ser maior que zero');
      valido = false;
    }
    if (!selVeiculo.value) {
      erros.push('Seleção de veículo é obrigatória');
      valido = false;
    }
    if (!validarDatas()) {
      erros.push('Datas inválidas');
      valido = false;
    }

    if (!valido) {
      if (msg) {
        msg.textContent = 'Erros encontrados: ' + erros.join(', ');
        msg.hidden = false;
        msg.className = 'error';
      }
    } else {
      if (msg) {
        msg.textContent = 'Formulário válido!';
        msg.hidden = false;
        msg.className = 'success';
      }
    }

    return valido;
  }

  function preencherDetalhes(v){
    if (!v) { 
      if (vCard) vCard.style.display='none'; 
      return; 
    }
    if (vCard) vCard.style.display='block';
    if (vTitulo) vTitulo.textContent = `${v.marca || ''} ${v.modelo || ''} (${v.matricula || ''})`;
    if (vLinha1) vLinha1.textContent = `${v.cor || ''} • ${v.combustivel || ''} • ${Number.isFinite(v.ano) ? v.ano : ''}`.trim();
    if (vLinha2) vLinha2.textContent = `${Number.isFinite(v.quilometragem) ? v.quilometragem + ' km' : ''} • ${v.nivelCombustivel || ''}`.trim();
  }

  function popularSeletor(){
    if (!selVeiculo) return;
    const atual = selVeiculo.value;
    selVeiculo.innerHTML = '<option value="">Seleciona um veículo do stock…</option>';
    for (const v of veiculos) {
      const opt = document.createElement('option');
      opt.value = v._id;
      opt.textContent = `${v.marca || ''} ${v.modelo || ''} • ${v.matricula || ''}`;
      selVeiculo.appendChild(opt);
    }
    if (atual) selVeiculo.value = atual;
  }

  btnValidar?.addEventListener('click', () => {
    validarFormulario();
  });

  selVeiculo?.addEventListener('change', async () => {
    const id = selVeiculo.value;
    if (!id) { 
      veiculoSelecionado = null; 
      preencherDetalhes(null); 
      return; 
    }
    try {
      const dbRef = window.db || db;
      if (!dbRef) {
        console.error('Firebase Database não está disponível');
        return;
      }
      const snap = await dbRef.ref(`veiculos/${id}`).once('value');
      veiculoSelecionado = snap.val() || null;
      preencherDetalhes(veiculoSelecionado);

      if (veiculoSelecionado && inputs.precoDiario) {
        inputs.precoDiario.value = veiculoSelecionado.precoDiario || '';
        atualizarTotais();
      }
    } catch (error) {
      console.error('Erro ao buscar dados do veículo:', error);
    }
  });

  if (typeof onAuthReady === 'function') {
    onAuthReady((user) => {
      try {
        const dbRef = window.db || db;
        if (!dbRef) {
          console.error('Firebase Database não está disponível');
          return;
        }
        const ref = dbRef.ref('veiculos');
        ref.on('value', (snap) => {
          const val = snap.val() || {}; 
          veiculos = Object.entries(val).map(([k,v]) => ({ _id:k, ...v }));
          popularSeletor();
        });
      } catch (error) {
        console.error('Erro ao carregar veículos:', error);
      }
    });
  } else {
    setTimeout(() => {
      try {
        const dbRef = window.db || db;
        if (dbRef) {
          const ref = dbRef.ref('veiculos');
          ref.on('value', (snap) => {
            const val = snap.val() || {}; 
            veiculos = Object.entries(val).map(([k,v]) => ({ _id:k, ...v }));
            popularSeletor();
          });
        }
      } catch (error) {
        console.error('Erro ao carregar veículos:', error);
      }
    }, 2000);
  }

  async function onGerar(){
    if (!msg) return;
    
    msg.hidden = true; 
    msg.textContent = '';
    
    try {
      if (!validarFormulario()) return;
      if (!inputs.cliNome?.value?.trim()) throw new Error('Indica o nome do cliente.');
      if (!selVeiculo?.value) throw new Error('Seleciona um veículo.');
      
      const d = calcularDias(inputs.inicio?.value, inputs.fim?.value);
      const pd = Number(inputs.precoDiario?.value || 0);
      
      if (d <= 0) throw new Error('Indica datas válidas (data de fim deve ser posterior à data de início).');
      if (!Number.isFinite(pd) || pd < 0) throw new Error('Indica o preço diário.');

      const cliente = {
        nome: inputs.cliNome.value.trim(),
        nif: inputs.cliNif?.value?.trim() || undefined,
        contacto: inputs.cliContacto?.value?.trim() || undefined,
        email: inputs.cliEmail?.value?.trim() || undefined,
        morada: inputs.cliMorada?.value?.trim() || undefined,
      };
      
      const veiculo = veiculoSelecionado || {};
      const orcamento = {
        inicio: inputs.inicio?.value || undefined,
        fim: inputs.fim?.value || undefined,
        dias: d,
        precoDiario: pd,
        extras: Number(inputs.extras?.value || 0) || 0,
        desconto: Number(inputs.desconto?.value || 0) || 0,
        caucao: Number(inputs.caucao?.value || '') || undefined,
        observacoes: inputs.obs?.value?.trim() || undefined,
      };

      if (typeof window.gerarOrcamentoPDF !== 'function') {
        throw new Error('Função gerarOrcamentoPDF não disponível.');
      }
      
      const dataUri = window.gerarOrcamentoPDF({ cliente, veiculo, orcamento }, {});
      
      if (window.pdfUtils?.downloadPdfDataUri) {
        window.pdfUtils.downloadPdfDataUri(dataUri, `orcamento-${(veiculo.matricula||'veiculo')}-${Date.now()}.pdf`);
      } else {
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `orcamento-${(veiculo.matricula||'veiculo')}-${Date.now()}.pdf`;
        link.click();
      }
      
      if (window.notifications) window.notifications.success('PDF gerado.');
      
    } catch (e) {
      console.error(e);
      if (msg) {
        msg.textContent = e?.message || 'Não foi possível gerar o PDF.';
        msg.hidden = false;
      }
      if (window.notifications) window.notifications.error(e?.message || 'Erro ao gerar PDF');
    }
  }

  btnGerar?.addEventListener('click', onGerar);

  // Pré-preenchimento via query string
  const urlParams = new URLSearchParams(window.location.search);
  const veiculoId = urlParams.get('veiculoId');
  if (veiculoId && selVeiculo) {
    try {
      const dbRef = window.db || db;
      if (dbRef) {
        dbRef.ref(`veiculos/${veiculoId}`).once('value').then((snap) => {
          if (snap.exists()) {
            veiculoSelecionado = snap.val();
            selVeiculo.value = veiculoId;
            preencherDetalhes(veiculoSelecionado);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao pré-preencher veículo:', error);
    }
  }

  // Definir data mínima como hoje
  const hoje = new Date().toISOString().split('T')[0];
  if (inputs.inicio) inputs.inicio.min = hoje;
  if (inputs.fim) inputs.fim.min = hoje;

  // Atualizar data mínima de fim quando início mudar
  if (inputs.inicio && inputs.fim) {
    inputs.inicio.addEventListener('change', () => {
      if (inputs.inicio.value) {
        inputs.fim.min = inputs.inicio.value;
        if (inputs.fim.value && inputs.fim.value < inputs.inicio.value) {
          inputs.fim.value = '';
          atualizarTotais();
        }
      }
    });
    inputs.fim.addEventListener('change', () => {
      if (inputs.fim.value) atualizarTotais();
    });
  }

})();
