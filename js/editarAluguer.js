(function initEditarAluguer() {
  const form = document.getElementById("aluguerForm");
  if (!form) return;

  // Wizard
  let currentStep = 1;
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const getStepEl = (n) =>
    steps.find((s) => Number(s.getAttribute("data-step")) === n);
  const showStep = (n) => {
    currentStep = n;
    steps.forEach((s) => {
      s.style.display = Number(s.getAttribute("data-step")) === n ? "" : "none";
    });
    if (n === 4) {
      renderResumo();
    }
    if (n === 5) {
      try {
        resizeSignaturePad?.();
        resizeSignaturePadLocadora?.();
      } catch {}
    }
  };
  function renderResumo() {
    const wrap = document.getElementById("resumoConteudo");
    if (!wrap) return;
    const cliente = {
      nome: document.getElementById("clienteNome").value.trim(),
      docTipo: document.getElementById("clienteDocTipo").value,
      docNumero: document.getElementById("clienteDocNumero").value.trim(),
      nif: document.getElementById("clienteNif").value.trim(),
      dataNascimento: document.getElementById("clienteDataNasc").value,
      contacto: document.getElementById("clienteContacto").value.trim(),
      email: document.getElementById("clienteEmail").value.trim(),
      morada: document.getElementById("clienteMorada").value.trim(),
    };
    const veiculoSel = document.getElementById("selVeiculo");
    const veiculoTxt =
      veiculoSel && veiculoSel.selectedIndex > 0
        ? veiculoSel.options[veiculoSel.selectedIndex].textContent
        : "—";
    const inicio = document.getElementById("algInicio").value;
    const fim = document.getElementById("algFim").value;
    const preco = document.getElementById("algPreco").value;
    const precoDiario = document.getElementById("algPrecoDiario")?.value || "";
    const caucao = document.getElementById("algCaucao")?.value || "";
    const formaPagamento =
      document.getElementById("algFormaPagamento")?.value || "";
    const localDevolucao =
      document.getElementById("algLocalDevolucao")?.value || "";
    const obs = document.getElementById("algObs").value || "";

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
          <div class="muted">${veiculoTxt || "—"}</div>
        </div>
      </div>
      <div style="margin-top:8px">
        <strong>Aluguer</strong>
        <div class="muted">Início: ${inicio || "—"}</div>
        <div class="muted">Fim: ${fim || "—"}</div>
        <div class="muted">Preço total: ${
          preco ? Number(preco).toFixed(2) + " €" : "—"
        }</div>
        <div class="muted">Preço diário: ${
          precoDiario ? Number(precoDiario).toFixed(2) + " €" : "—"
        }</div>
        <div class="muted">Caução: ${
          caucao ? Number(caucao).toFixed(2) + " €" : "—"
        }</div>
        <div class="muted">Forma de pagamento: ${formaPagamento || "—"}</div>
        <div class="muted">Local de devolução: ${localDevolucao || "—"}</div>
        ${obs ? `<div class="muted">Observações: ${obs}</div>` : ""}
      </div>
    `;
  }
  const validateStep = (n) => {
    const stepEl = getStepEl(n);
    if (!stepEl) return true;
    const inputs = Array.from(
      stepEl.querySelectorAll("input, select, textarea")
    );
    let ok = true;
    for (const el of inputs) {
      if (typeof el.reportValidity === "function" && !el.reportValidity()) {
        ok = false;
        break;
      }
    }
    if (ok && n === 2) {
      const sel = document.getElementById("selVeiculo");
      if (!sel || !sel.value) {
        sel?.focus();
        ok = false;
      }
    }
    if (ok && n === 3) {
      const inicio = document.getElementById("algInicio");
      const fim = document.getElementById("algFim");
      if (
        inicio &&
        fim &&
        inicio.value &&
        fim.value &&
        new Date(fim.value) < new Date(inicio.value)
      ) {
        try {
          fim.setCustomValidity("A data fim deve ser posterior ao início.");
          fim.reportValidity();
        } finally {
          fim.setCustomValidity("");
        }
        ok = false;
      }
    }
    return ok;
  };
  const nextStep = () => {
    if (validateStep(currentStep)) showStep(Math.min(currentStep + 1, 5));
  };
  const prevStep = () => {
    showStep(Math.max(currentStep - 1, 1));
  };
  const onFormClick = (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.classList.contains("btn-next")) {
      e.preventDefault();
      nextStep();
    }
    if (t.classList.contains("btn-prev")) {
      e.preventDefault();
      prevStep();
    }
  };
  form.addEventListener("click", onFormClick);
  showStep(1);

  let signaturePad;
  let signaturePadLocadora;
  let resizeSignaturePad;
  let resizeSignaturePadLocadora;
  let contratoId;
  let contratoOriginal;

  const canvas = document.getElementById("signaturePad");
  const clearBtn = document.getElementById("clearSignature");
  const canvasLoc = document.getElementById("signaturePadLocadora");
  const clearBtnLoc = document.getElementById("clearSignatureLocadora");

  let sigCleanup = null;
  let sigLocCleanup = null;
  if (canvas && window.forms?.createSignaturePad) {
    const { pad, resize, cleanup } = window.forms.createSignaturePad(
      canvas,
      clearBtn
    );
    signaturePad = pad;
    resizeSignaturePad = resize;
    sigCleanup = cleanup;
  }
  if (canvasLoc && window.forms?.createSignaturePad) {
    const { pad, resize, cleanup } = window.forms.createSignaturePad(
      canvasLoc,
      clearBtnLoc
    );
    signaturePadLocadora = pad;
    resizeSignaturePadLocadora = resize;
    sigLocCleanup = cleanup;
  }

  // console.log("Canvas element:", document.getElementById("signaturePad"));
  // console.log("SignaturePad library available:", typeof SignaturePad);
  // console.log(
  //   "createSignaturePad function available:",
  //   typeof window.forms?.createSignaturePad
  // );
  // canvas.addEventListener("mousedown", () => console.log("Mouse down"));
  // canvas.addEventListener("touchstart", () => console.log("Touch start"));

  // Adicionar inputs de fotografia dinamicamente
  const fotosWrap = document.getElementById("veicFotosWrap");
  const addFotoBtn = document.getElementById("addFoto");
  addFotoBtn?.addEventListener("click", () => {
    if (!fotosWrap) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.className = "veicFoto";
    fotosWrap.appendChild(input);
    try {
      input.click();
    } catch {}
  });

  // Seletor de veículo do stock: igual ao novo-aluguer
  let veiculosLista = [];
  let indisponiveisPorId = new Set();
  let indisponiveisPorMatricula = new Set();
  const selVeiculo = document.getElementById("selVeiculo");
  const detCard = document.getElementById("veiculoDetalhes");
  const vdTitulo = document.getElementById("vdTitulo");
  const vdLinha1 = document.getElementById("vdLinha1");
  const vdLinha2 = document.getElementById("vdLinha2");
  let veiculoSelecionado = null;
  let veiculoSelecionadoId = null;

  const preencherDetalhes = (v) => {
    if (!v) {
      if (detCard) detCard.style.display = "none";
      return;
    }
    detCard.style.display = "block";
    vdTitulo.textContent = `${v.marca || ""} ${v.modelo || ""} (${
      v.matricula || ""
    })`;
    vdLinha1.textContent = `${v.cor || ""} • ${v.combustivel || ""} • ${
      Number.isFinite(v.ano) ? v.ano : ""
    }`.trim();
    vdLinha2.textContent = `${
      Number.isFinite(v.quilometragem) ? v.quilometragem + " km" : ""
    } • ${v.nivelCombustivel || ""}`.trim();
    if (fotosWrap) {
      fotosWrap.innerHTML = "";
      (v.fotos || []).forEach((foto) => {
        const fotoContainer = document.createElement("div");
        fotoContainer.style.position = "relative";
        fotoContainer.style.display = "inline-block";
        fotoContainer.style.margin = "4px";

        const img = document.createElement("img");
        img.src = foto;
        img.style.width = "100px";
        img.style.height = "100px";
        img.style.objectFit = "cover";
        img.style.border = "1px solid #ccc";
        img.style.borderRadius = "4px";

        const removeBtn = document.createElement("button");
        removeBtn.innerHTML = "×";
        removeBtn.style.position = "absolute";
        removeBtn.style.top = "-8px";
        removeBtn.style.right = "-8px";
        removeBtn.style.width = "20px";
        removeBtn.style.height = "20px";
        removeBtn.style.borderRadius = "50%";
        removeBtn.style.border = "none";
        removeBtn.style.background = "var(--danger)";
        removeBtn.style.color = "white";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.fontSize = "14px";
        removeBtn.style.fontWeight = "bold";
        removeBtn.onclick = () => fotoContainer.remove();

        fotoContainer.appendChild(img);
        fotoContainer.appendChild(removeBtn);
        fotosWrap.appendChild(fotoContainer);
      });
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.className = "veicFoto";
      fotosWrap.appendChild(input);
    }
  };

  const popularSeletor = (todos) => {
    if (!selVeiculo) return;
    const atual = selVeiculo.value;
    selVeiculo.innerHTML =
      '<option value="">Seleciona um veículo do stock…</option>';
    for (const v of todos) {
      const opt = document.createElement("option");
      opt.value = v._id;
      const matriculaNorm = (v.matricula || "").trim().toLowerCase();
      const estaIndisponivel =
        (v._id && indisponiveisPorId.has(v._id)) ||
        (matriculaNorm && indisponiveisPorMatricula.has(matriculaNorm));
      opt.textContent = `${v.marca || ""} ${v.modelo || ""} • ${
        v.matricula || ""
      }${estaIndisponivel ? " (indisponível)" : ""}`;
      if (estaIndisponivel) opt.disabled = true;
      selVeiculo.appendChild(opt);
    }
    if (atual) selVeiculo.value = atual;
  };

  let veiculosRef = null;
  let alugueresRef = null;
  let veiculosCb = null;
  let alugueresCb = null;
  if (selVeiculo) {
    auth.onAuthStateChanged((user) => {
      if (!user) return;
      veiculosRef = db.ref("veiculos");
      veiculosCb = (snap) => {
        const val = snap.val() || {};
        veiculosLista = Object.entries(val).map(([k, v]) => ({ _id: k, ...v }));
        popularSeletor(veiculosLista);
      };
      veiculosRef.on("value", veiculosCb);
      alugueresRef = db.ref("alugueres");
      alugueresCb = (snap) => {
        const val = snap.val() || {};
        const ids = new Set();
        const mats = new Set();
        for (const [, contrato] of Object.entries(val)) {
          const vid = contrato.veiculoId;
          if (vid) ids.add(vid);
          const mat = (contrato.veiculo?.matricula || "").trim().toLowerCase();
          if (mat) mats.add(mat);
        }
        indisponiveisPorId = ids;
        indisponiveisPorMatricula = mats;
        popularSeletor(veiculosLista);
      };
      alugueresRef.on("value", alugueresCb);
    });
    selVeiculo.addEventListener("change", async () => {
      const id = selVeiculo.value;
      if (!id) {
        veiculoSelecionado = null;
        preencherDetalhes(null);
        return;
      }
      const snap = await db.ref(`veiculos/${id}`).once("value");
      veiculoSelecionado = snap.val() || null;
      veiculoSelecionadoId = id;
      preencherDetalhes(veiculoSelecionado);
    });
  }

  // Função para carregar dados do contrato
  const carregarContrato = (contrato) => {
    contratoOriginal = contrato;
    contratoId = contrato._id;

    // Mostrar ID do contrato
    const contratoIdSpan = document.getElementById("contratoId");
    if (contratoIdSpan) {
      contratoIdSpan.textContent = `ID: ${contratoId}`;
    }

    const c = contrato.cliente || {};
    const v = contrato.veiculo || {};
    const a = contrato.aluguer || {};

    // Preencher dados do cliente
    document.getElementById("clienteNome").value = c.nome || "";
    document.getElementById("clienteDocTipo").value = c.documento?.tipo || "CC";
    document.getElementById("clienteDocNumero").value =
      c.documento?.numero || "";
    document.getElementById("clienteNif").value = c.nif || "";
    document.getElementById("clienteDataNasc").value = c.dataNascimento || "";
    document.getElementById("clienteContacto").value = c.contacto || "";
    document.getElementById("clienteEmail").value = c.email || "";
    document.getElementById("clienteMorada").value = c.morada || "";

    // Pré-selecionar veículo no seletor se existir id, senão tentar por matrícula
    if (selVeiculo) {
      const trySet = () => {
        if (
          veiculoSelecionadoId &&
          selVeiculo.querySelector(`option[value="${veiculoSelecionadoId}"]`)
        ) {
          selVeiculo.value = veiculoSelecionadoId;
          return true;
        }
        return false;
      };
      // fallback por matrícula quando não temos veiculoId no contrato
      if (!contrato.veiculoId && v.matricula) {
        const match = (veiculosLista || []).find(
          (x) =>
            (x.matricula || "").trim().toLowerCase() ===
            v.matricula.trim().toLowerCase()
        );
        if (match) {
          veiculoSelecionadoId = match._id;
          veiculoSelecionado = match;
          preencherDetalhes(match);
          setTimeout(trySet, 200);
        } else {
          preencherDetalhes(v);
        }
      } else {
        veiculoSelecionadoId = contrato.veiculoId || null;
        veiculoSelecionado = v || null;
        preencherDetalhes(v);
        setTimeout(trySet, 200);
      }
    }

    // (editar) Sem checklists nesta página; ignorar

    // Preencher dados do aluguer
    document.getElementById("algInicio").value = a.inicio || "";
    document.getElementById("algFim").value = a.fim || "";
    document.getElementById("algPreco").value = a.precoTotal || "";
    document.getElementById("algPrecoDiario").value = a.precoDiario || "";
    document.getElementById("algCaucao").value = a.precoCaucao || "";
    document.getElementById("algFormaPagamento").value = a.formaPagamento || "";
    document.getElementById("algLocalDevolucao").value = a.localDevolucao || "";
    document.getElementById("algObs").value = a.observacoes || "";

    // Redimensionar canvas após preencher
    try {
      resizeSignaturePad?.();
      resizeSignaturePadLocadora?.();
    } catch {}
    // Carregar assinaturas existentes
    if (a.assinatura && signaturePad) {
      signaturePad.fromDataURL(a.assinatura);
    }
    if (a.assinaturaLocadora && signaturePadLocadora) {
      signaturePadLocadora.fromDataURL(a.assinaturaLocadora);
    }

    // Carregar fotos existentes
    // fotos existentes são mostradas em preencherDetalhes
  };

  // Verificar se há ID na URL
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  if (id) {
    // Aguarda sessão antes de ler dados (evita leitura sem auth e falsos "não encontrado")
    auth.onAuthStateChanged((user) => {
      if (!user) return;
      const primeiraLeitura = db
        .ref(`alugueres/${id}`)
        .once("value")
        .then((snapshot) => {
          if (snapshot.exists()) {
            const contrato = { _id: id, ...snapshot.val() };
            carregarContrato(contrato);
          } else {
            alert("Contrato não encontrado.");
            window.location.href = "historico.html";
          }
        })
        .catch((error) => {
          alert("Erro ao carregar contrato.");
          window.location.href = "historico.html";
        });
      window.loading
        ?.when([primeiraLeitura])
        .then(() => window.dispatchEvent(new Event("page-ready")));
    });
  } else {
    alert("ID do contrato não especificado.");
    window.location.href = "historico.html";
  }

  const cleanup = () => {
    try {
      form.removeEventListener("click", onFormClick);
    } catch {}
    try {
      sigCleanup?.();
    } catch {}
    try {
      sigLocCleanup?.();
    } catch {}
    try {
      if (veiculosRef && veiculosCb) veiculosRef.off("value", veiculosCb);
    } catch {}
    try {
      if (alugueresRef && alugueresCb) alugueresRef.off("value", alugueresCb);
    } catch {}
  };
  window.addEventListener("beforeunload", cleanup);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cleanup();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (currentStep < 5) {
      nextStep();
      return;
    }
    const msg = document.getElementById("formMsg");
    msg.hidden = true;
    const submitBtn = document.getElementById("submitBtn");

    // Helpers locais (fallback) quando pdfUtils não está disponível
    const extractBase64PdfCompat = (dataUriOrBase64) => {
      if (!dataUriOrBase64) return "";
      if (typeof dataUriOrBase64 !== "string") return "";
      if (dataUriOrBase64.startsWith("data:")) {
        return (dataUriOrBase64.split(",")[1] || "").replace(/\s+/g, "");
      }
      return dataUriOrBase64
        .replace(/^data:application\/pdf(?:;filename=[^;]+)?;base64,/, "")
        .replace(/\s+/g, "");
    };
    const downloadPdfDataUriCompat = (dataUri, filename) => {
      try {
        // tentar via Blob se possível
        const parts = dataUri.split(",");
        const base64 = (parts[1] || "").replace(/\s+/g, "");
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        const mimeMatch = (parts[0] || "").match(/data:(.*?);base64/);
        const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
        const blob = new Blob([bytes], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } catch {
        try {
          window.open(dataUri, "_blank");
        } catch {}
      }
    };

    try {
      if (submitBtn) submitBtn.disabled = true;
      if (msg) {
        msg.textContent = "A atualizar...";
        msg.hidden = false;
      }

      const cliente = {
        nome: document.getElementById("clienteNome").value.trim(),
        documento: {
          tipo: document.getElementById("clienteDocTipo").value,
          numero: document.getElementById("clienteDocNumero").value.trim(),
        },
        nif: document.getElementById("clienteNif").value.trim(),
        dataNascimento: document.getElementById("clienteDataNasc").value,
        contacto: document.getElementById("clienteContacto").value.trim(),
        email: document.getElementById("clienteEmail").value.trim(),
        morada: document.getElementById("clienteMorada").value.trim(),
      };

      // (editar) Sem edição direta de km/ano neste formulário
      // Partimos do veículo selecionado no stock, aplicando overrides de campos editáveis se necessário
      const baseVeiculo = veiculoSelecionado
        ? JSON.parse(JSON.stringify(veiculoSelecionado))
        : contratoOriginal?.veiculo || {};
      const veiculo = { ...baseVeiculo };

      const precoTotalVal = Number(document.getElementById("algPreco").value);
      const precoDiarioVal = Number(
        document.getElementById("algPrecoDiario")?.value || ""
      );
      const caucaoVal = Number(
        document.getElementById("algCaucao")?.value || ""
      );
      const aluguer = {
        inicio: document.getElementById("algInicio").value,
        fim: document.getElementById("algFim").value,
        precoTotal: Number.isFinite(precoTotalVal) ? precoTotalVal : 0,
        precoDiario: Number.isFinite(precoDiarioVal)
          ? precoDiarioVal
          : undefined,
        precoCaucao: Number.isFinite(caucaoVal) ? caucaoVal : undefined,
        formaPagamento:
          document.getElementById("algFormaPagamento")?.value || undefined,
        localDevolucao:
          document.getElementById("algLocalDevolucao")?.value.trim() ||
          undefined,
        observacoes:
          document.getElementById("algObs")?.value.trim() || undefined,
        assinatura:
          signaturePad && !signaturePad.isEmpty()
            ? signaturePad.toDataURL("image/png")
            : contratoOriginal?.aluguer?.assinatura || null,
        assinaturaLocadora:
          signaturePadLocadora && !signaturePadLocadora.isEmpty()
            ? signaturePadLocadora.toDataURL("image/png")
            : contratoOriginal?.aluguer?.assinaturaLocadora || null,
      };

      // Validar inputs simples
      if (
        !cliente.nome ||
        !veiculo.matricula ||
        !aluguer.inicio ||
        !aluguer.fim
      ) {
        throw new Error("Preenche os campos obrigatórios.");
      }

      // Construir fotos finais: imagens visíveis (após remoções) + novas dos inputs
      const fotosWrapEl = document.getElementById("veicFotosWrap");
      const visiveis = fotosWrapEl
        ? Array.from(fotosWrapEl.querySelectorAll("img")).map((img) => img.src)
        : [];
      const fileInputs = Array.from(
        document.querySelectorAll("#veicFotosWrap .veicFoto")
      );
      const novas = [];
      for (const input of fileInputs) {
        const files = Array.from(input.files || []);
        for (const file of files) {
          try {
            const dataUrl = await fileToDataURL(file);
            const resized = await resizeImageDataURL(dataUrl, 1280, 1280);
            novas.push(resized || dataUrl);
          } catch (error) {}
        }
      }
      veiculo.fotos = visiveis.length ? [...visiveis, ...novas] : novas;

      const data = {
        cliente,
        veiculo,
        aluguer,
        veiculoId:
          veiculoSelecionadoId || contratoOriginal?.veiculoId || undefined,
      };

      // Gerar novo PDF
      const user = auth?.currentUser || null;
      const userMeta = {
        uid: user?.uid || null,
        email: user?.email || null,
        nome: user?.displayName || user?.email || "—",
      };
      const agoraIso = new Date().toISOString();

      // Verificar se jsPDF está disponível
      if (
        typeof window.jspdf === "undefined" ||
        !window.jspdf ||
        !window.jspdf.jsPDF
      ) {
        throw new Error(
          "jsPDF não está disponível. Verifique se o script foi carregado corretamente."
        );
      }

      // Verificar se gerarContratoPDF está disponível
      if (typeof gerarContratoPDF !== "function") {
        throw new Error("Função gerarContratoPDF não está disponível");
      }

      let pdfDataUri = await gerarContratoPDF({
        id: contratoId,
        ...data,
        atualizadoPor: userMeta,
        atualizadoEm: agoraIso,
      });
      // Extrair base64 (usar pdfUtils se disponível, senão fallback)
      const extractBase64 =
        window.pdfUtils &&
        typeof window.pdfUtils.extractBase64Pdf === "function"
          ? window.pdfUtils.extractBase64Pdf
          : extractBase64PdfCompat;
      data.pdfBase64 = extractBase64(pdfDataUri);
      data.atualizadoPor = userMeta;
      data.atualizadoEm = agoraIso;

      // Atualizar fotos no stock do veículo (se existir veiculoSelecionadoId ou por matrícula)
      try {
        const user = auth?.currentUser || null;
        const userMeta = {
          uid: user?.uid || null,
          email: user?.email || null,
          nome: user?.displayName || user?.email || "—",
        };
        const agoraIso = new Date().toISOString();
        let stockId =
          veiculoSelecionadoId || contratoOriginal?.veiculoId || null;
        if (!stockId) {
          const mat = (veiculo?.matricula || "").trim().toLowerCase();
          if (mat) {
            const snapAll = await db.ref("veiculos").once("value");
            const val = snapAll.val() || {};
            for (const [k, v] of Object.entries(val)) {
              const m = (v.matricula || "").trim().toLowerCase();
              if (m && m === mat) {
                stockId = k;
                break;
              }
            }
          }
        }
        if (stockId) {
          await db.ref(`veiculos/${stockId}`).update({
            fotos: Array.isArray(veiculo.fotos) ? veiculo.fotos : [],
            atualizadoPor: userMeta,
            atualizadoEm: agoraIso,
          });
        }
      } catch (e) {}

      // Atualizar no Firebase (contrato)
      await db.ref(`alugueres/${contratoId}`).update(data);

      msg.textContent = "Contrato atualizado com sucesso!";
      msg.hidden = false;

      // Disponibilizar download do PDF atualizado (usar compat se necessário)
      if (
        window.pdfUtils &&
        typeof window.pdfUtils.downloadPdfDataUri === "function"
      ) {
        window.pdfUtils.downloadPdfDataUri(
          pdfDataUri,
          `contrato-${contratoId}.pdf`
        );
      } else {
        downloadPdfDataUriCompat(pdfDataUri, `contrato-${contratoId}.pdf`);
      }

      setTimeout(() => {
        window.location.href = "historico.html";
      }, 1200);
    } catch (err) {
      const msg = document.getElementById("formMsg");
      msg.textContent =
        "Erro ao atualizar: " + (err?.message || "tenta novamente.");
      msg.hidden = false;
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
