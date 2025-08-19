(function () {
  if (
    typeof window.jspdf === "undefined" ||
    !window.jspdf ||
    !window.jspdf.jsPDF
  ) {
    console.warn("jsPDF não está disponível ainda para orcamento.");
  }

  function deepMerge(base = {}, extra = {}) {
    const out = { ...base };
    for (const k in extra) {
      if (
        extra[k] &&
        typeof extra[k] === "object" &&
        !Array.isArray(extra[k]) &&
        typeof base[k] === "object" &&
        base[k] !== null &&
        !Array.isArray(base[k])
      ) {
        out[k] = deepMerge(base[k], extra[k]);
      } else {
        out[k] = extra[k];
      }
    }
    return out;
  }

  const DEFAULT_STYLES = {
    page: {
      size: "a4",
      unit: "pt",
      marginLeft: 40,
      marginRight: 40,
      marginTop: 40,
      marginBottom: 50,
      headerHeight: 60,
    },
    colors: {
      headerBg: [255, 255, 255],
      headerText: [35, 35, 35],
      text: [30, 30, 30],
      subTitleBg: [238, 242, 247],
      subTitleText: [55, 65, 81],
      labelText: [100, 100, 100],
      divider: [220, 220, 220],
      primary: [0, 0, 0],
      accent: [0,0,0],
      muted: [120, 120, 120],
      tableHeaderBg: [245, 247, 250],
    },
    fonts: {
      default: "helvetica",
      titleSize: 22,
      subTitleSize: 12,
      textSize: 10,
      labelSize: 10,
      smallSize: 9,
    },
    layout: { sectionSpacing: 2, lineSpacing: 14, titleBottomGap: 16 },
    header: { show: true },
  };

  function makePdfHelpers(doc, styles, company) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = styles.page.marginLeft;
    const right = styles.page.marginRight;
    const top = styles.page.marginTop;
    const usableWidth = pageWidth - left - right;
    let y = top;
    const addHeader = () => {
      doc.setFillColor(...styles.colors.headerBg);
      doc.rect(
        0,
        0,
        doc.internal.pageSize.getWidth(),
        styles.page.headerHeight,
        "F"
      );
      // Logo
      if (window.appLogoDataURL) {
        try {
          doc.addImage(window.appLogoDataURL, "PNG", left, 12, 150, 30);
        } catch {}
      }
      // Company block (right)
      doc.setFont(styles.fonts.default, "bold");
      doc.setFontSize(12);
      doc.setTextColor(...styles.colors.headerText);
      const compX = pageWidth - right - 240;
      const compY = 16;
      doc.text(company.name, compX, compY);
      doc.setFont(styles.fonts.default, "normal");
      doc.setFontSize(styles.fonts.smallSize);
      doc.setTextColor(...styles.colors.muted);
      const lines = [
        `NIF ${company.nif}`,
        company.address,
        `${company.email}  |  ${company.phone}`,
      ];
      lines.forEach((ln, i) =>
        doc.text(String(ln || ""), compX, compY + 12 + i * 11)
      );
      y = styles.page.headerHeight + 32;
    };
    const ensureSpace = (h) => {
      const bottom =
        doc.internal.pageSize.getHeight() - styles.page.marginBottom;
      if (y + h > bottom) {
        doc.addPage();
        y = top;
        if (styles.header.show) addHeader();
      }
    };
    const writeTitle = (t) => {
      // Reservar espaço suficiente para o título + barra + espaçamento
      const titleHeight = 38; // Altura do título
      const barHeight = 3; // Altura da barra de destaque
      const spacingAfter = styles.layout.titleBottomGap + 24; // Espaçamento após o título
      const totalHeight = titleHeight + barHeight + spacingAfter;
      
      ensureSpace(totalHeight);
      
      // Adicionar espaço extra antes do título para separar do cabeçalho
      y += 8;
      
      doc.setFont(styles.fonts.default, "bold");
      doc.setFontSize(styles.fonts.titleSize);
      doc.setTextColor(...styles.colors.primary);
      doc.text(String(t || ""), left, y);
      
      // Desenhar barra de destaque
      doc.setDrawColor(...styles.colors.accent);
      doc.setFillColor(...styles.colors.accent);
      doc.rect(left, y + 6, 60, barHeight, "F");
      
      // Mover para a posição após o título com espaçamento adequado
      y += titleHeight + spacingAfter;
    };
    const writeSubTitle = (t) => {
      // Reservar espaço suficiente para o subtítulo + espaçamento
      const subtitleHeight = 26; // Altura do texto do subtítulo
      const spacingAfter = styles.layout.sectionSpacing; // Espaçamento após o subtítulo
      const totalHeight = subtitleHeight + spacingAfter;
      
      ensureSpace(totalHeight);
      
      // Adicionar espaço extra antes do subtítulo para separar do conteúdo anterior
      y += 12;
      
      doc.setFont(styles.fonts.default, "bold");
      doc.setFontSize(styles.fonts.subTitleSize);
      doc.setTextColor(...styles.colors.subTitleText);
      doc.text(String(t || "").toUpperCase(), left, y);
      
      // Mover para a posição após o subtítulo com espaçamento adequado
      y += subtitleHeight + spacingAfter;
    };
    const writeKV = (label, value) => {
      ensureSpace(18);
      doc.setFont(styles.fonts.default, "bold");
      doc.setFontSize(styles.fonts.labelSize);
      doc.setTextColor(...styles.colors.labelText);
      const lbl = (label || "") + ": ";
      const w = doc.getTextWidth(lbl);
      doc.text(lbl, left, y);
      doc.setFont(styles.fonts.default, "normal");
      doc.setFontSize(styles.fonts.textSize);
      doc.setTextColor(...styles.colors.text);
      const maxW = usableWidth - w;
      const lines = doc.splitTextToSize(String(value ?? "—"), maxW);
      doc.text(lines, left + w, y);
      y += Math.max(18, lines.length * styles.layout.lineSpacing);
    };
    const writeText = (text) => {
      const lines = doc.splitTextToSize(String(text || ""), usableWidth);
      for (const line of lines) {
        ensureSpace(styles.layout.lineSpacing);
        doc.text(line, left, y);
        y += styles.layout.lineSpacing;
      }
    };
    const drawDivider = () => {
      doc.setDrawColor(...styles.colors.divider);
      doc.line(left, y, left + usableWidth, y);
      y += 6;
    };
    return {
      left,
      usableWidth,
      addHeader,
      ensureSpace,
      writeTitle,
      writeSubTitle,
      writeKV,
      writeText,
      drawDivider,
      get y() {
        return y;
      },
      set y(v) {
        y = v;
      },
    };
  }

  function calcularTotais(dias, precoDiario, extras, desconto) {
    const d = Number.isFinite(dias) ? dias : 0;
    const pd = Number.isFinite(precoDiario) ? precoDiario : 0;
    const ex = Number.isFinite(extras) ? extras : 0;
    const de = Number.isFinite(desconto) ? desconto : 0;
    const subtotal = pd * d + ex;
    const total = Math.max(0, subtotal - de);
    return { subtotal, total };
  }

  function gerarOrcamentoPDF(payload, options = {}) {
    if (
      typeof window.jspdf === "undefined" ||
      !window.jspdf ||
      !window.jspdf.jsPDF
    ) {
      throw new Error(
        "jsPDF não está disponível. Verifique se o script foi carregado."
      );
    }
    const { jsPDF } = window.jspdf;
    const styles = deepMerge(DEFAULT_STYLES, options.styles || {});
    const company = Object.assign(
      {
        name: "Grupo OptCar",
        nif: "222222222",
        address: "Lugar Fontes 379, 4585-251 Parada de Todeia, Paredes",
        email: "rentacar@gmail.com",
        phone: "963136372",
        jurisdiction: "Lisboa",
        logo:
          typeof window !== "undefined" && window.appLogoDataURL
            ? window.appLogoDataURL
            : null,
      },
      options.company || {}
    );

    const doc = new jsPDF({ unit: styles.page.unit, format: styles.page.size });
    const H = makePdfHelpers(doc, styles, company);

    try {
      doc.setProperties({
        title: "Orçamento",
        subject: "Proposta de Aluguer",
        author: company.name,
        creator: "OptCar App",
      });
    } catch {}
    if (styles.header.show) H.addHeader?.();
    H.writeTitle("Orçamento de Aluguer de Veículo");

    const cli = payload.cliente || {};
    const vei = payload.veiculo || {};
    const orc = payload.orcamento || {};
    const agora = new Date();
    const ref = `ORC-${agora.getFullYear()}${String(
      agora.getMonth() + 1
    ).padStart(2, "0")}${String(agora.getDate()).padStart(2, "0")}-${String(
      agora.getHours()
    ).padStart(2, "0")}${String(agora.getMinutes()).padStart(2, "0")}`;

    doc.setFont(styles.fonts.default, "normal");
    doc.setFontSize(styles.fonts.textSize);
    doc.setTextColor(...styles.colors.muted);
    doc.text(
      `Data: ${agora.toLocaleDateString("pt-PT")}   |   Ref.: ${ref}`,
      H.left,
      H.y
    );
    H.y += 20; // Mais espaço após a data
    H.drawDivider();
    H.y += 16; // Espaçamento após o divisor

    // Two-column info cards (Cliente / Veículo)
    const gap = 16;
    const colW = (H.usableWidth - gap) / 2;
    const boxPad = 10;
    const startY = H.y;
    const leftX = H.left;
    const rightX = H.left + colW + gap;
    // Prepare text lines
    doc.setFont(styles.fonts.default, "bold");
    doc.setFontSize(styles.fonts.subTitleSize);
    doc.setTextColor(...styles.colors.subTitleText);
    const leftTitle = "Cliente";
    const rightTitle = "Veículo";
    const clientLines = [
      `${cli.nome || "—"}`,
      `Contacto: ${cli.contacto || "—"}${cli.email ? "  |  " + cli.email : ""}`,
      cli.morada ? `Morada: ${cli.morada}` : "",
    ].filter(Boolean);
    const vehicleLines = [
      `${vei.marca || "—"} ${vei.modelo || ""}`.trim(),
      `Matrícula: ${vei.matricula || "—"}`,
      `${vei.cor || ""} ${vei.cor && vei.combustivel ? "•" : ""} ${
        vei.combustivel || ""
      }`.trim(),
      Number.isFinite(vei.ano) ? `Ano: ${vei.ano}` : "",
    ].filter(Boolean);
    // Estimate heights
    doc.setFont(styles.fonts.default, "normal");
    doc.setFontSize(styles.fonts.textSize);
    doc.setTextColor(...styles.colors.text);
    const lh = styles.layout.lineSpacing;
    const headerH = 18;
    const leftH = headerH + clientLines.length * lh + boxPad * 2;
    const rightH = headerH + vehicleLines.length * lh + boxPad * 2;
    const boxH = Math.max(leftH, rightH);
    // Draw boxes
    doc.setDrawColor(...styles.colors.divider);
    doc.roundedRect(leftX, startY, colW, boxH, 4, 4);
    doc.roundedRect(rightX, startY, colW, boxH, 4, 4);
    // Titles inside boxes
    doc.setFont(styles.fonts.default, "bold");
    doc.setFontSize(styles.fonts.subTitleSize);
    doc.setTextColor(...styles.colors.subTitleText);
    doc.text(leftTitle, leftX + boxPad, startY + boxPad + 4);
    doc.text(rightTitle, rightX + boxPad, startY + boxPad + 4);
    // Lines
    doc.setFont(styles.fonts.default, "normal");
    doc.setFontSize(styles.fonts.textSize);
    doc.setTextColor(...styles.colors.text);
    let yy = startY + boxPad + headerH;
    clientLines.forEach((line) => {
      doc.text(
        doc.splitTextToSize(line, colW - boxPad * 2),
        leftX + boxPad,
        yy
      );
      yy += lh;
    });
    yy = startY + boxPad + headerH;
    vehicleLines.forEach((line) => {
      doc.text(
        doc.splitTextToSize(line, colW - boxPad * 2),
        rightX + boxPad,
        yy
      );
      yy += lh;
    });
    H.y = startY + boxH + 24; // Mais espaço após os cards

    // Pricing table
    const { subtotal, total } = calcularTotais(
      Number(orc.dias),
      Number(orc.precoDiario),
      Number(orc.extras),
      Number(orc.desconto)
    );
    const fmt = (n) =>
      Number.isFinite(Number(n)) ? `${Number(n).toFixed(2)} €` : "—";
    const rows = [
      [
        "Período",
        `${orc.inicio || "—"} a ${orc.fim || "—"} (${
          Number(orc.dias) || 0
        } dia(s))`,
      ],
      ["Preço diário", fmt(orc.precoDiario)],
      ["Extras", fmt(orc.extras)],
      ["Desconto", fmt(orc.desconto)],
      ["Subtotal", fmt(subtotal)],
      ["Total", fmt(total)],
    ];
    if (Number.isFinite(Number(orc.caucao)))
      rows.push(["Caução", fmt(orc.caucao)]);

    const drawTable = (title, data) => {
      H.writeSubTitle(title);
      const rowH = 20;
      const x0 = H.left;
      const w0 = Math.floor(H.usableWidth * 0.45);
      const w1 = H.usableWidth - w0;
      const padX = 8;
      const padY = 6;
      // Header
      H.ensureSpace(rowH + 2);
      doc.setFillColor(...styles.colors.tableHeaderBg);
      doc.rect(x0, H.y, w0, rowH, "F");
      doc.rect(x0 + w0, H.y, w1, rowH, "F");
      doc.setFont(styles.fonts.default, "bold");
      doc.setFontSize(styles.fonts.textSize);
      doc.setTextColor(...styles.colors.subTitleText);
      doc.text("Item", x0 + padX, H.y + rowH - padY);
      const hdr = "Valor";
      const tw = doc.getTextWidth(hdr);
      doc.text(hdr, x0 + w0 + (w1 / 2 - tw / 2), H.y + rowH - padY);
      H.y += rowH;
      // Rows
      doc.setFont(styles.fonts.default, "normal");
      doc.setTextColor(...styles.colors.text);
      data.forEach((r, idx) => {
        H.ensureSpace(rowH + 2);
        // zebra
        if (idx % 2 === 0) {
          doc.setFillColor(252, 253, 255);
          doc.rect(x0, H.y, w0 + w1, rowH, "F");
        }
        doc.rect(x0, H.y, w0, rowH);
        doc.rect(x0 + w0, H.y, w1, rowH);
        const isTotal = r[0] === "Total";
        if (isTotal) {
          doc.setFillColor(...styles.colors.accent);
          doc.rect(x0, H.y, w0 + w1, rowH, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont(styles.fonts.default, "bold");
        }
        doc.text(String(r[0] || ""), x0 + padX, H.y + rowH - padY);
        const val = String(r[1] || "");
        const ttw = doc.getTextWidth(val);
        doc.text(val, x0 + w0 + (w1 / 2 - ttw / 2), H.y + rowH - padY);
        if (isTotal) {
          doc.setFont(styles.fonts.default, "normal");
          doc.setTextColor(...styles.colors.text);
        }
        H.y += rowH;
      });
      H.y += 16; // Mais espaço após a tabela
    };
    drawTable("Condições económicas", rows);

    // Observações em cartão
    if (orc.observacoes) {
      H.writeSubTitle("Observações");
      const cardX = H.left,
        cardY = H.y,
        cardW = H.usableWidth;
      const pad = 10;
      const text = doc.splitTextToSize(
        String(orc.observacoes),
        cardW - pad * 2
      );
      const cardH = text.length * styles.layout.lineSpacing + pad * 2 + 4;
      H.ensureSpace(cardH);
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(...styles.colors.divider);
      doc.roundedRect(cardX, H.y, cardW, cardH, 4, 4, "FD");
      doc.setTextColor(...styles.colors.text);
      doc.setFont(styles.fonts.default, "normal");
      let ty = H.y + pad + 10;
      text.forEach((ln) => {
        doc.text(ln, cardX + pad, ty);
        ty += styles.layout.lineSpacing;
      });
      H.y = cardY + cardH + 16; // Mais espaço após as observações
    }

    H.writeSubTitle("Condições gerais");
    const clausulas = [
      "Este orçamento é válido por 7 dias salvo indicação em contrário.",
      "A reserva do veículo só fica garantida após confirmação por parte da OptCar.",
      "O preço apresentado inclui apenas os itens discriminados. Serviços adicionais poderão ser orçamentados à parte.",
      "É necessária caução no levantamento do veículo, a qual será devolvida após verificação do estado do veículo.",
      "O cliente deve possuir carta de condução válida e documento de identificação.",
      `Foro competente: comarca de ${company.jurisdiction}.`,
    ];
    const startX = H.left + 16;
    doc.setFont(styles.fonts.default, "normal");
    doc.setTextColor(...styles.colors.text);
    clausulas.forEach((txt, i) => {
      H.ensureSpace(styles.layout.lineSpacing + 2);
      doc.setFont(styles.fonts.default, "bold");
      doc.setTextColor(...styles.colors.subTitleText);
      doc.text(`${i + 1}.`, H.left, H.y);
      doc.setFont(styles.fonts.default, "normal");
      doc.setTextColor(...styles.colors.text);
      const lines = doc.splitTextToSize(String(txt || ""), H.usableWidth - 16);
      lines.forEach((ln) => {
        doc.text(ln, startX, H.y);
        H.y += styles.layout.lineSpacing;
      });
      H.y += 8; // Mais espaço entre cláusulas
    });

    // Footer
    H.ensureSpace(30);
    H.drawDivider();
    doc.setFont(styles.fonts.default, "normal");
    doc.setFontSize(styles.fonts.smallSize);
    doc.setTextColor(...styles.colors.muted);
    const footer = `${company.name} • NIF ${company.nif} • ${company.address} • ${company.email} • ${company.phone}`;
    const twFooter = doc.getTextWidth(footer);
    const cx = H.left + (H.usableWidth / 2 - twFooter / 2);
    doc.text(footer, Math.max(H.left, cx), H.y + 10);

    return doc.output("datauristring");
  }

  window.gerarOrcamentoPDF = gerarOrcamentoPDF;
  window.calcularTotaisOrcamento = calcularTotais;
})();
