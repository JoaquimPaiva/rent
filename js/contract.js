/* ============================================================================
   Geração de PDF (Contrato e Receção) com sistema de estilos personalizável
   Requer jsPDF disponível em window.jspdf.jsPDF
   ============================================================================ */

/** Util: merge raso + merge profundo simples para objects aninhados */
function deepMerge(base = {}, extra = {}) {
  const out = { ...base };
  for (const k in extra) {
    if (
      extra[k] &&
      typeof extra[k] === 'object' &&
      !Array.isArray(extra[k]) &&
      typeof base[k] === 'object' &&
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

/** Estilos padrão partilhados por ambos os PDFs */
const DEFAULT_STYLES = {
  page: {
    size: 'a4',
    unit: 'pt',
    marginLeft: 40,
    marginRight: 40,
    marginTop: 40,
    marginBottom: 50,
    headerHeight: 50
  },
  colors: {
    headerBg: [255, 255, 255], // Fundo de cabeçalho mais claro
    headerText: [50, 50, 50],
    text: [30, 30, 30],
    subTitleBg: [230, 230, 230], // Fundo de subtítulo
    subTitleText: [50, 50, 50],
    labelText: [80, 80, 80],
    divider: [200, 200, 200], // Divisor mais suave
    primary: [0, 0, 0] // Cor primária para destacar elementos
  },
  fonts: {
    default: 'helvetica',
    titleSize: 20,
    subTitleSize: 12,
    textSize: 10,
    labelSize: 10,
    smallSize: 9
  },
  layout: {
    sectionSpacing: 20,
    lineSpacing: 12,
    boxHeight: 20,
    titleBottomGap: 15,
    subtitlePaddingY: 8,
    kvLabelGap: 5,
  },
  header: {
    show: true,
    showDividerUnderTitle: false // Desativar para uma estética mais limpa
  },
  images: {
    gridCols: 2,
    cellWidth: 240,
    cellHeight: 160,
    gap: 10,
    formatFallback: 'JPEG'
  },
  signatures: {
    boxWidth: 220,
    boxHeight: 70,
    labelOffsetY: 14,
    imageWidth: 210,
    imageHeight: 60,
    imageOffsetX: 4,
    imageOffsetY: 30
  }
};

/* =========================
   Funções utilitárias de desenho (reutilizadas)
   ========================= */
function makePdfHelpers(doc, styles, company) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = styles.page.marginLeft;
  const right = styles.page.marginRight;
  const top = styles.page.marginTop;
  const center = (pageWidth - left - right) / 2.5;
  const bottomLimit = pageHeight - styles.page.marginBottom;
  const usableWidth = pageWidth - left - right;

  let y = top;

  const ensureSpace = (h) => {
    if (y + h > bottomLimit) {
      doc.addPage();
      y = top;
      if (styles.header.show) addHeader();
    }
  };

  const ensureTitleSpace = () => {
    if (y > bottomLimit - 60) {
      doc.addPage();
      y = top;
      if (styles.header.show) addHeader();
    }
  };

  const addHeader = () => {
    // Fundo
    doc.setFillColor(...styles.colors.headerBg);
    doc.rect(0, 0, pageWidth, styles.page.headerHeight, 'F');

    // Adiciona o logo da empresa ou o nome
    doc.setFont(styles.fonts.default, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...styles.colors.headerText);

    if (company.logo) {
        // Tenta adicionar o logo
        try {
            doc.addImage(company.logo, 'JPEG', center, 10, 150, 30); // Posição e tamanho ajustáveis
        } catch (e) {
            // Erro silencioso em produção
            doc.text(company.name, left, 30);
        }
    } else {
    doc.text(company.name, left, 30);
    }

    doc.setFont(styles.fonts.default, 'normal');
    doc.setFontSize(styles.fonts.smallSize);
    doc.setTextColor(120, 120, 120); // Cor mais suave para os contatos
    const headerLine = ``;
    doc.text(headerLine, left, 42, { maxWidth: usableWidth });
    doc.setTextColor(...styles.colors.text);

    y = styles.page.headerHeight + 40;
  };

  const drawDivider = () => {
    doc.setDrawColor(...styles.colors.divider);
    doc.line(left, y, pageWidth - right, y);
  };

  const writeTitle = (text) => {
    ensureSpace(40);
    doc.setFont(styles.fonts.default, 'bold');
    doc.setFontSize(styles.fonts.titleSize);
    doc.setTextColor(...styles.colors.primary); // Cor primária para o título principal
    doc.text(text, left, y);
    y += 30;

    if (styles.header.showDividerUnderTitle) {
      drawDivider();
    }
    y += styles.layout.titleBottomGap;
  };

  const writeSubTitle = (text) => {
    ensureTitleSpace();
    doc.setFont(styles.fonts.default, 'bold');
    doc.setFontSize(styles.fonts.subTitleSize);
    doc.setTextColor(...styles.colors.subTitleText);
    
    // Adicionar uma linha antes e depois do subtítulo para um visual mais limpo
    doc.setDrawColor(...styles.colors.divider);
    doc.line(left, y - 4, left + usableWidth, y - 4);
    
    doc.text(String(text || '').toUpperCase(), left, y + 15);
    y += 22;
    doc.line(left, y - 4, left + usableWidth, y - 4);

    y += styles.layout.sectionSpacing;
  };

  const writeText = (text, opts = {}) => {
    const {
      font = 'normal',
      size = styles.fonts.textSize,
      color = styles.colors.text,
      lineGap = styles.layout.lineSpacing
    } = opts;

    const lines = doc.splitTextToSize(String(text ?? ''), usableWidth);
    doc.setFont(styles.fonts.default, font);
    doc.setFontSize(size);
    doc.setTextColor(...color);

    for (const line of lines) {
      ensureSpace(lineGap);
      doc.text(line, left, y);
      y += lineGap;
    }
  };

  const writeKV = (label, value) => {
    ensureSpace(styles.layout.boxHeight);
    doc.setFont(styles.fonts.default, 'bold');
    doc.setFontSize(styles.fonts.labelSize);
    doc.setTextColor(...styles.colors.labelText);

    const labelText = (label ?? '') + ': ';
    const labelWidth = doc.getTextWidth(labelText);

    doc.text(labelText, left + 5, y + 12);

    const maxWidth = usableWidth - labelWidth;
    doc.setFont(styles.fonts.default, 'normal');
    doc.setFontSize(styles.fonts.textSize);
    doc.setTextColor(...styles.colors.text);

    const valueStr = String(value ?? 'N/D');
    const lines = doc.splitTextToSize(valueStr, maxWidth);

    if (lines.length <= 1) {
      doc.text(valueStr, left + 5 + labelWidth, y + 12, { maxWidth });
      y += styles.layout.boxHeight;
    } else {
      doc.text(lines[0], left + 5 + labelWidth, y + 12, { maxWidth });
      y += styles.layout.boxHeight;
      for (let i = 1; i < lines.length; i++) {
        ensureSpace(styles.layout.lineSpacing);
        doc.text(lines[i], left + 5, y + 12 - (styles.layout.boxHeight - styles.layout.lineSpacing));
        y += styles.layout.lineSpacing;
      }
      y += 4;
    }
  };

  const writeClause = (num, text) => {
    ensureTitleSpace();
    doc.setFont(styles.fonts.default, 'bold');
    doc.setFontSize(styles.fonts.textSize);
    doc.setTextColor(60, 60, 60);
    doc.text(`${num}.`, left, y);

    const xStart = left + 20;
    const lines = doc.splitTextToSize(String(text ?? ''), usableWidth - 20);
    doc.setFont(styles.fonts.default, 'normal');
    doc.setFontSize(styles.fonts.textSize);
    doc.setTextColor(...styles.colors.text);

    for (const line of lines) {
      ensureSpace(styles.layout.lineSpacing);
      doc.text(line, xStart, y);
      y += styles.layout.lineSpacing;
    }
    y += 6;
  };

  const writeSpacer = (h = styles.layout.sectionSpacing) => {
    ensureSpace(h);
    y += h;
  };

  const writeImageGrid = (images = [], fmt = styles.images.formatFallback) => {
    if (!Array.isArray(images) || images.length === 0) return;

    const w = styles.images.cellWidth;
    const h = styles.images.cellHeight;
    const gap = styles.images.gap;
    const cols = styles.images.gridCols;
    const colWidth = w + gap;

    for (let i = 0; i < images.length; i++) {
      const col = i % cols;
      const x = left + col * colWidth;
      if (col === 0) {
        ensureSpace(h + gap);
      }
      try {
        doc.addImage(images[i], fmt, x, y, w, h);
      } catch (e) {
        try {
          const altFmt = fmt === 'JPEG' ? 'PNG' : 'JPEG';
          doc.addImage(images[i], altFmt, x, y, w, h);
        } catch {}
      }
      if (col === cols - 1) y += h + gap;
    }
    if (images.length % cols !== 0) y += h + gap;
  };

  const writeSignatures = (opts) => {
    const {
      leftTitle,
      leftName,
      leftImage,
      rightTitle,
      rightName,
      rightImage
    } = opts;

    ensureSpace(150);
    const signY = y;
    const boxWidth = 220;
    const boxHeight = 70;
    const boxGap = 40;
    const leftX = left + (usableWidth / 2 - boxWidth - boxGap / 2);
    const rightX = left + (usableWidth / 2 + boxGap / 2);
    const s = styles.signatures;

    // Assinaturas em duas colunas, centralizadas
    // Esquerda
    doc.setFont(styles.fonts.default, 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(leftTitle, leftX, signY);
    doc.setFont(styles.fonts.default, 'normal');
    doc.setTextColor(...styles.colors.text);
    doc.text(leftName || 'N/D', leftX, signY + s.labelOffsetY);
    doc.rect(leftX, signY + 26, boxWidth, boxHeight);
    doc.text('Assinatura:', leftX + 4, signY + 40);

    // Direita
    doc.setFont(styles.fonts.default, 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(rightTitle, rightX, signY);
    doc.setFont(styles.fonts.default, 'normal');
    doc.setTextColor(...styles.colors.text);
    doc.text(rightName || 'N/D', rightX, signY + s.labelOffsetY);
    doc.rect(rightX, signY + 26, boxWidth, boxHeight);
    doc.text('Assinatura:', rightX + 4, signY + 40);

    // Imagens de assinatura
    if (leftImage) {
      try {
        doc.addImage(leftImage, 'PNG', leftX + s.imageOffsetX, signY + s.imageOffsetY, s.imageWidth, s.imageHeight);
      } catch {}
    }
    if (rightImage) {
      try {
        doc.addImage(rightImage, 'PNG', rightX + s.imageOffsetX, signY + s.imageOffsetY, s.imageWidth, s.imageHeight);
      } catch {}
    }

    y = signY + 120;
  };

  return {
    get y() { return y; },
    set y(v) { y = v; },
    pageWidth, pageHeight, left, right, top, bottomLimit, usableWidth,
    ensureSpace, ensureTitleSpace, addHeader, drawDivider,
    writeTitle, writeSubTitle, writeText, writeKV, writeClause, writeSpacer,
    writeImageGrid, writeSignatures
  };
}

/* ============================================
   GERAR CONTRATO
   ============================================ */
function gerarContratoPDF(payload, options = {}) {
  if (typeof window.jspdf === 'undefined' || !window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('jsPDF não está disponível. Verifique se o script foi carregado corretamente.');
  }
  const { jsPDF } = window.jspdf;

  const styles = deepMerge(DEFAULT_STYLES, options.styles || {});
  const company = Object.assign({
    name: 'Grupo OptCar',
    nif: '222222222',
    address: 'Lugar Fontes 379, 4585-251 Parada de Todeia, Paredes',
    email: 'rentacar@gmail.com',
    phone: '963136372',
    jurisdiction: 'Lisboa',
    logo: (typeof window !== 'undefined' && window.appLogoDataURL) ? window.appLogoDataURL : null
  }, options.company || {});

  const doc = new jsPDF({ unit: styles.page.unit, format: styles.page.size });

  const cliente = payload.cliente || {};
  const veiculo = payload.veiculo || {};
  const aluguer = payload.aluguer || {};
  const autoria = {
    criadoPor: payload.criadoPor || payload.atualizadoPor || null,
    criadoEm: payload.criadoEm || payload.atualizadoEm || null
  };
  const fotos = Array.isArray(veiculo.fotos) ? veiculo.fotos : [];

  const H = makePdfHelpers(doc, styles, company);

  try {
    doc.setProperties({
      title: `Contrato ${payload.id || ''}`.trim(),
      subject: 'Contrato de Aluguer',
      author: company.name,
      creator: 'Grupo OptCar App',
      keywords: 'aluguer, contrato, Grupo OptCar, pdf'
    });
  } catch {}

  if (styles.header.show) H.addHeader();
  H.writeTitle('Contrato de Aluguer de Veículo');

  doc.setFont(styles.fonts.default, 'normal');
  doc.setFontSize(styles.fonts.textSize);
  doc.setTextColor(60, 60, 60);
  const dataContrato = payload.criadoEm || payload.atualizadoEm || null;
  const linhaData = `Contrato n.º ${payload.id || 'N/D'}  —  Data: ${dataContrato ? new Date(dataContrato).toLocaleDateString() : new Date().toLocaleDateString()}`;
  doc.text(linhaData, H.left, H.y);
  H.y += 20;

  if (autoria.criadoPor || autoria.criadoEm) {
    const quem = autoria.criadoPor?.nome || autoria.criadoPor?.email || '—';
    const quando = autoria.criadoEm ? new Date(autoria.criadoEm).toLocaleString() : '';
    doc.setFont(styles.fonts.default, 'italic');
    doc.setFontSize(styles.fonts.smallSize);
    doc.setTextColor(90, 90, 90);
    doc.text(`Emitido por: ${quem}${quando ? ' em ' + quando : ''}`, H.left, H.y);
    doc.setFont(styles.fonts.default, 'normal');
    doc.setTextColor(...styles.colors.text);
    H.y += 14;
  }

  H.writeSubTitle('1. Identificação das Partes');
  const linhaLocador = `${company.name}, locadora com o NIF n.º ${company.nif}, com sede em ${company.address}, e os contactos ${company.email} / ${company.phone}.`;
  const docCliente = `${(cliente.documento?.tipo) || 'Documento'} ${cliente.documento?.numero || ''}`.trim();
  const linhaLocatario = `${cliente.nome || 'Locatário'}, ${docCliente ? 'portador do Documento de Identificação n.º ' + docCliente + ',' : ''} e Numero de Identificação Fiscal ${cliente.nif || 'N/D'}, Com residência em ${cliente.morada || 'N/D'}, e os contactos n.º ${cliente.contacto || 'N/D'} / ${cliente.email || 'N/D'}.`;
  H.writeText(linhaLocador);
  H.writeSpacer(6);
  H.writeText(linhaLocatario);
  H.writeSpacer(6);
  H.writeSpacer();

  H.writeSubTitle('2. Identificação do Veículo');
  const linhaVeiculo1 = `O veículo da marca ${veiculo.marca || ''}, modelo ${veiculo.modelo || ''}, com a cor (${veiculo.cor || 'cor indef.'}), com a matrícula ${veiculo.matricula || 'N/D'}, do ano ${veiculo.ano || 'N/D'}, com o combustível definido como: ${veiculo.combustivel || 'N/D'}, n.º de chassi/VIN ${veiculo.vin || 'N/D'} e o nível de combustível a ${veiculo.nivelCombustivel || 'N/D'}, com quilometragem à entrega ${typeof veiculo.quilometragem === 'number' ? `${veiculo.quilometragem} km` : 'N/D'}.`;
  // const linhaVeiculo2 = `O VIN ${veiculo.vin || 'N/D'}; nível de combustível ${veiculo.nivelCombustivel || 'N/D'}; quilometragem à entrega ${typeof veiculo.quilometragem === 'number' ? `${veiculo.quilometragem} km` : 'N/D'}.`;
  H.writeText(linhaVeiculo1);
  // H.writeText(linhaVeiculo2);
  H.writeSpacer(6);

  // Estado do veículo na entrega (texto + checklist simples)
  H.writeSubTitle('2.1 Estado do Veículo na Entrega');
  if (veiculo.estado) {
    H.writeKV('Estado geral', String(veiculo.estado));
  }
  if (veiculo.estadoChecklist) {
    const ck = veiculo.estadoChecklist || {};
    const checklistEntrega = [
      `Pneus: ${ck.pneus ? 'OK' : 'Não OK'}`,
      `Pintura: ${ck.pintura ? 'OK' : 'Não OK'}`,
      `Vidros: ${ck.vidros ? 'OK' : 'Não OK'}`,
      `Interior: ${ck.interior ? 'OK' : 'Não OK'}`,
      `Luzes: ${ck.luzes ? 'OK' : 'Não OK'}`
    ].join('  |  ');
    H.writeKV('Checklist', checklistEntrega);
  }
  H.writeSpacer(6);

  const checklist = veiculo.estadoChecklist ? [
    `Pneus: ${veiculo.estadoChecklist.pneus ? 'OK' : 'Não OK'}`,
    `Pintura: ${veiculo.estadoChecklist.pintura ? 'OK' : 'Não OK'}`,
    `Vidros: ${veiculo.estadoChecklist.vidros ? 'OK' : 'Não OK'}`,
    `Interior: ${veiculo.estadoChecklist.interior ? 'OK' : 'Não OK'}`,
    `Luzes: ${veiculo.estadoChecklist.luzes ? 'OK' : 'Não OK'}`
  ].join('  |  ') : 'N/D';

  // H.writeKV('Estado Geral', veiculo.estado ? String(veiculo.estado) : 'N/D');
  // H.writeKV('Estado Checklist', checklist);
  H.writeSpacer();
  H.writeSpacer();
  H.writeSpacer();

  H.writeSubTitle('3. Prazo de Aluguer');
  const linhaPrazo = `O período de aluguer decorre de ${aluguer.inicio || 'N/D'} até ${aluguer.fim || 'N/D'}, com devolução no local ${aluguer.localDevolucao || 'N/D'}.`;
  H.writeText(linhaPrazo);
  H.writeSpacer(6);
  H.writeSpacer();

  H.writeSubTitle('4. Valor e Condições de Pagamento');
  const precoTotal = (typeof aluguer.precoTotal === 'number') ? `${aluguer.precoTotal.toFixed(2)} €` : 'N/D';
  const precoDiario = (typeof aluguer.precoDiario === 'number') ? `${aluguer.precoDiario.toFixed(2)} €` : 'N/D';
  const caucao = (typeof aluguer.precoCaucao === 'number') ? `${aluguer.precoCaucao.toFixed(2)} €` : 'N/D';
  const linhaPagamento = `Preço total ${precoTotal} (diário ${precoDiario}); caução ${caucao}; forma de pagamento: ${aluguer.formaPagamento || 'N/D'}.`;
  H.writeText(linhaPagamento);
  H.writeSpacer(6);
  H.writeSpacer();

  H.writeSubTitle('5. Cláusulas Contratuais');
  H.writeSpacer();
  const clausulas = [
    'Objeto do Contrato: O LOCADOR cede temporariamente ao LOCATÁRIO o uso do veículo acima identificado, mediante as condições estabelecidas neste contrato.',
    'Prazo de Aluguer: O veículo é cedido pelo período indicado na cláusula 3, devendo ser devolvido no local e data acordados.',
    'Valor e Pagamento: O LOCATÁRIO pagará ao LOCADOR o valor acordado pelo aluguer, bem como a caução prevista, que será devolvida após verificação do estado do veículo.',
    'Obrigações do Locatário: Utilizar o veículo de forma diligente; não permitir condução por terceiros não autorizados; não usar o veículo para fins ilícitos, competições ou fora de estrada; manter o veículo trancado quando não utilizado; repor o combustível no mesmo nível de entrega; comunicar imediatamente acidentes, avarias ou danos.',
    'Seguro e Responsabilidade: O veículo encontra-se coberto por seguro [terceiros/todos os riscos] com franquia de valor a definir; em caso de acidente, o LOCATÁRIO é responsável pela franquia salvo cobertura adicional.',
    'Manutenção e Assistência: O LOCADOR garante o bom funcionamento e inspeção válida; em caso de avaria, o LOCATÁRIO deve contactar o LOCADOR antes de qualquer reparação; custos de manutenção ordinária são do LOCADOR, salvo mau uso.',
    'Rescisão Antecipada: O contrato pode ser rescindido pelo LOCADOR se houver violação das condições; pelo LOCATÁRIO com aviso prévio, sem devolução dos valores pagos.',
    'Entrega do Veículo: O veículo deve ser devolvido em iguais condições de limpeza, combustível e funcionamento, salvo desgaste normal.',
    `Foro Competente: Para todas as questões emergentes deste contrato, as partes elegem o foro da comarca de ${company.jurisdiction}, com renúncia a qualquer outro.`
  ];
  clausulas.forEach((txt, i) => H.writeClause(i + 1, txt));
  H.writeSpacer();

  if (aluguer.observacoes) {
    H.writeSubTitle('6. Observações');
    H.writeSpacer();
    H.writeText(String(aluguer.observacoes));
  }

  H.ensureSpace(150);
  H.writeSubTitle('7. Assinaturas');
  H.writeSpacer();

  H.writeSignatures({
    leftTitle: 'Locador',
    leftName: autoria.criadoPor?.nome || autoria.criadoPor?.email || company.name,
    leftImage: aluguer.assinaturaLocadora || null,
    rightTitle: 'Locatário/Condutor',
    rightName: cliente.nome || 'N/D',
    rightImage: aluguer.assinatura || null
  });

  if (Array.isArray(fotos) && fotos.length) {
    H.ensureSpace(30);
    H.writeSubTitle('Anexo I — Registo Fotográfico');
    H.writeImageGrid(fotos, 'JPEG');
  }

  return doc.output('datauristring');
}

/* ============================================
   GERAR RELATÓRIO DE RECEÇÃO
   ============================================ */
function gerarRececaoPDF(payload, options = {}) {
  if (typeof window.jspdf === 'undefined' || !window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('jsPDF não está disponível. Verifique se o script foi carregado corretamente.');
  }
  const { jsPDF } = window.jspdf;

  const styles = deepMerge(DEFAULT_STYLES, options.styles || {});
  const company = Object.assign({
    name: 'Grupo OptCar, Lda.',
    nif: '222222222',
    address: 'Rua da Alegria, 123, Lisboa',
    email: 'rentacar@gmail.com',
    phone: '919191919',
    jurisdiction: 'Lisboa',
    logo: null
  }, options.company || {});

  const doc = new jsPDF({ unit: styles.page.unit, format: styles.page.size });

  const cliente = payload.cliente || {};
  const veiculo = payload.veiculo || {};
  const aluguer = payload.aluguer || {};
  const rececao = payload.rececao || {};
  const autoria = {
    criadoPor: rececao?.recebidoPor || payload.criadoPor || null,
    criadoEm: rececao?.recebidoEm || payload.criadoEm || null
  };
  const fotos = Array.isArray(rececao.fotosDevolucao) ? rececao.fotosDevolucao : [];

  const H = makePdfHelpers(doc, styles, company);

  try {
    doc.setProperties({
      title: `Receção ${payload.id || ''}`.trim(),
      subject: 'Relatório de Receção do Veículo',
      author: company.name,
      creator: 'Grupo OptCar App',
      keywords: 'receção, devolução, relatório, pdf'
    });
  } catch {}

  if (styles.header.show) H.addHeader();
  H.writeTitle('Relatório de Receção do Veículo');

  doc.setFont(styles.fonts.default, 'normal');
  doc.setFontSize(styles.fonts.textSize);
  doc.setTextColor(60, 60, 60);
  const dataRelatorio = rececao.recebidoEm || payload.atualizadoEm || payload.criadoEm || null;
  doc.text(
    `Contrato n.º ${payload.id || 'N/D'}  —  Data do relatório: ${dataRelatorio ? new Date(dataRelatorio).toLocaleString() : new Date().toLocaleString()}`,
    H.left, H.y
  );
  H.y += 20;

  if (autoria.criadoPor || autoria.criadoEm) {
    const quem = autoria.criadoPor?.nome || autoria.criadoPor?.email || '—';
    const quando = autoria.criadoEm ? new Date(autoria.criadoEm).toLocaleString() : '';
    doc.setFont(styles.fonts.default, 'italic');
    doc.setFontSize(styles.fonts.smallSize);
    doc.setTextColor(90, 90, 90);
    doc.text(`Rececionado por: ${quem}${quando ? ' em ' + quando : ''}`, H.left, H.y);
    doc.setFont(styles.fonts.default, 'normal');
    doc.setTextColor(...styles.colors.text);
    H.y += 14;
  }

  H.writeSubTitle('1. Identificação das Partes');
  H.writeKV('Locador', company.name);
  H.writeKV('NIF Locador', company.nif);
  H.writeKV('Contactos Locador', `${company.email} | ${company.phone}`);
  H.writeKV('Locatário/Condutor', cliente.nome || 'N/D');
  H.writeKV('Documento', `${(cliente.documento?.tipo) || 'N/D'} ${cliente.documento?.numero || ''}`);
  H.writeKV('Contacto', `${cliente.contacto || 'N/D'} | ${cliente.email || 'N/D'}`);
  H.writeSpacer();

  H.writeSubTitle('2. Veículo');
  H.writeKV('Marca / Modelo', `${veiculo.marca || 'N/D'} ${veiculo.modelo || ''}`);
  H.writeKV('Matrícula', veiculo.matricula || 'N/D');
  H.writeKV('Quilometragem entrega', typeof veiculo.quilometragem === 'number' ? `${veiculo.quilometragem} km` : 'N/D');
  H.writeKV('Nível combustível entrega', veiculo.nivelCombustivel || 'N/D');
  H.writeSpacer();

  H.writeSubTitle('3. Dados da Devolução');
  H.writeKV('Data/hora da devolução', rececao.dataDevolucao || 'N/D');
  H.writeKV('Quilometragem à devolução', typeof rececao.quilometragemDevolucao === 'number' ? `${rececao.quilometragemDevolucao} km` : 'N/D');
  H.writeKV('Nível combustível à devolução', typeof rececao.nivelCombustivelDevolucao === 'number' ? `${rececao.nivelCombustivelDevolucao}%` : 'N/D');
  H.writeKV('Estado geral', rececao.estadoGeralDevolucao || 'N/D');

  // --- Checklist detalhado em tabelas (PDF) ---
  const drawTable = (title, headers, rows, widths) => {
    const rowH = 18;
    const padX = 4;
    const padY = 5;
    const x0 = H.left;
    const totalW = H.usableWidth;
    const cols = headers.length;
    const wArr = (Array.isArray(widths) && widths.length === cols)
      ? widths.map(w => Math.round(totalW * w))
      : Array.from({ length: cols }, () => Math.floor(totalW / cols));
    const headerBg = styles.colors.subTitleBg || [230,230,230];

    // Título da tabela
    H.writeSubTitle(title);

    // Header row
    H.ensureSpace(rowH + 4);
    let x = x0;
    doc.setFillColor(...headerBg);
    for (let c = 0; c < cols; c++) {
      const cw = wArr[c];
      doc.rect(x, H.y, cw, rowH, 'F');
      doc.setFont(styles.fonts.default, 'bold');
      doc.setFontSize(styles.fonts.textSize);
      const txt = String(headers[c]);
      if (c === 0) {
        doc.text(txt, x + padX, H.y + rowH - padY);
      } else {
        const tw = doc.getTextWidth(txt);
        doc.text(txt, x + cw / 2 - tw / 2, H.y + rowH - padY);
      }
      x += cw;
    }
    H.y += rowH;

    // Rows
    rows.forEach((r) => {
      H.ensureSpace(rowH + 2);
      let xx = x0;
      for (let c = 0; c < cols; c++) {
        const cw = wArr[c];
        doc.rect(xx, H.y, cw, rowH);
        doc.setFont(styles.fonts.default, 'normal');
        doc.setFontSize(styles.fonts.textSize);
        const cell = r[c];
        const text = (cell === true || cell === false) ? (cell ? '✔' : '—') : String(cell ?? '');
        if (c === 0) {
          doc.text(text, xx + padX, H.y + rowH - padY);
        } else {
          const tw = doc.getTextWidth(text);
          doc.text(text, xx + cw / 2 - tw / 2, H.y + rowH - padY);
        }
        xx += cw;
      }
      H.y += rowH;
    });

    H.writeSpacer(10);
  };

  // Renderizar checklist
  if (rececao.checklistDetalhado) {
    const cd = rececao.checklistDetalhado;
    // Carroçaria
    if (cd.carroçaria) {
      drawTable('Checklist: Carroçaria', ['Item', 'Esq.', 'Dir.', 'Frente', 'Trás', 'Topo'], [
        ['Portas (frente)', !!cd.carroçaria.portaFrenteEsq, !!cd.carroçaria.portaFrenteDir, '', '', ''],
        ['Portas (trás)', !!cd.carroçaria.portaTrasEsq, !!cd.carroçaria.portaTrasDir, '', '', ''],
        ['Guarda-lamas', !!cd.carroçaria.guardaLamasEsq, !!cd.carroçaria.guardaLamasDir, '', '', ''],
        ['Para-choques', '', '', !!cd.carroçaria.paraChoquesFrente, !!cd.carroçaria.paraChoquesTras, ''],
        ['Capot/Tejadilho', '', '', !!cd.carroçaria.capot, '', !!cd.carroçaria.tejadilho],
      ], [0.36, 0.12, 0.12, 0.16, 0.12, 0.12]);
    }
    // Jantes e Pneus
    if (cd.jantesPneus) {
      drawTable('Checklist: Jantes e Pneus', ['Posição', 'FE', 'FD', 'TE', 'TD'], [
        ['Pneus', !!cd.jantesPneus.pneuFE, !!cd.jantesPneus.pneuFD, !!cd.jantesPneus.pneuTE, !!cd.jantesPneus.pneuTD],
      ], [0.4, 0.15, 0.15, 0.15, 0.15]);
      drawTable('Acessórios (Pneus)', ['Item', 'OK'], [
        ['Jantes OK', !!cd.jantesPneus.jantesOK],
        ['Pneu suplente', !!cd.jantesPneus.pneuSuplente],
        ['Macaco', !!cd.jantesPneus.macaco],
        ['Chave de rodas', !!cd.jantesPneus.chaveRodas],
      ], [0.7, 0.3]);
    }
    // Vidros e Espelhos
    if (cd.vidrosEspelhos) {
      drawTable('Checklist: Vidros e Espelhos', ['Elemento', 'Frente', 'Laterais', 'Trás', 'Espelhos'], [
        ['Vidros', !!cd.vidrosEspelhos.parabrisas, !!cd.vidrosEspelhos.vidrosLaterais, !!cd.vidrosEspelhos.vidroTraseiro, !!cd.vidrosEspelhos.espelhos],
      ], [0.36, 0.16, 0.16, 0.16, 0.16]);
    }
    // Luzes
    if (cd.luzes) {
      drawTable('Checklist: Luzes', ['Item', 'OK'], [
        ['Médios', !!cd.luzes.medios],
        ['Máximos', !!cd.luzes.maximos],
        ['Piscas', !!cd.luzes.piscas],
        ['Traseiras', !!cd.luzes.traseiras],
        ['Stop', !!cd.luzes.stop],
        ['Ré', !!cd.luzes.re],
        ['Nevoeiro', !!cd.luzes.nevoeiro],
      ], [0.7, 0.3]);
    }
    // Interior
    if (cd.interior) {
      drawTable('Checklist: Interior', ['Item', 'OK'], [
        ['Bancos', !!cd.interior.bancos],
        ['Tapetes', !!cd.interior.tapetes],
        ['Estofos', !!cd.interior.estofos],
        ['Tablier', !!cd.interior.tablier],
        ['Rádio/Infotainment', !!cd.interior.radio],
        ['AC/Aquecimento', !!cd.interior.ac],
      ], [0.7, 0.3]);
    }
    // Equipamento e Documentos
    if (cd.equipamentoDocs) {
      drawTable('Checklist: Equipamento e Documentos', ['Item', 'OK'], [
        ['Triângulo', !!cd.equipamentoDocs.triangulo],
        ['Colete', !!cd.equipamentoDocs.colete],
        ['Kit 1.º socorros', !!cd.equipamentoDocs.kitSocorros],
        ['Documento único automóvel', !!cd.equipamentoDocs.dua],
        ['Apólice/Cartão de Seguro', !!cd.equipamentoDocs.seguro],
        ['Inspeção válida', !!cd.equipamentoDocs.inspecao],
        ['2.ª Chave', !!cd.equipamentoDocs.segundaChave],
      ], [0.7, 0.3]);
    }
    // Eletrónica
    if (cd.eletronica) {
      drawTable('Checklist: Eletrónica e Funcionamento', ['Item', 'OK'], [
        ['Vidros elétricos', !!cd.eletronica.vidrosEletricos],
        ['Travão de mão', !!cd.eletronica.travaoMao],
        ['Fechos portas', !!cd.eletronica.fechosPortas],
        ['Alarme', !!cd.eletronica.alarme],
      ], [0.7, 0.3]);
    }
    // Fluídos
    if (cd.fluidos) {
      drawTable('Checklist: Fluídos', ['Item', 'OK'], [
        ['Nível de óleo', !!cd.fluidos.oleo],
        ['Líquido de refrigeração', !!cd.fluidos.refrigerante],
        ['Líquido limpa pára-brisas', !!cd.fluidos.limpaParaBrisas],
      ], [0.7, 0.3]);
    }
  } else {
    // Fallback: checklist simples
    const rows = [
      ['Pneus', !!rececao.estadoPneus],
      ['Pintura', !!rececao.estadoPintura],
      ['Vidros', !!rececao.estadoVidros],
      ['Interior', !!rececao.estadoInterior],
      ['Luzes', !!rececao.estadoLuzes],
    ];
    drawTable('Checklist', ['Item', 'OK'], rows, [0.7, 0.3]);
  }
  H.writeSpacer();

  if (rececao.danosIdentificados) {
    H.writeSubTitle('4. Danos Identificados');
    H.writeText(String(rececao.danosIdentificados));
    H.writeSpacer(10);
  }

  // Se existirem danos detalhados guardados, listar também
  // try {
  //   if (payload.id) {
  //     // Nota: geração de PDF é síncrona. Não conseguimos ler Firebase aqui.
  //     // Usamos dados do payload, se presentes, em rececao.danosDetalhados
  //     if (Array.isArray(rececao.danosDetalhados) && rececao.danosDetalhados.length) {
  //       H.writeSubTitle('4.1. Detalhe de Danos');
  //       rececao.danosDetalhados.forEach((it, idx) => {
  //         H.writeText(`${idx+1}. ${it.tipo || 'Dano'} em ${it.localizacao || '—'}${it.dimensao ? ` (${it.dimensao})` : ''} — ${it.severidade || 'Leve'}${typeof it.custoEstimado === 'number' && it.custoEstimado > 0 ? ` — Estimativa: €${Number(it.custoEstimado).toFixed(2)}` : ''}`);
  //       });
  //       H.writeSpacer(10);
  //     }
  //   }
  // } catch {}

  if (rececao.observacoesRececao) {
    H.writeSubTitle('5. Observações');
    H.writeText(String(rececao.observacoesRececao));
    H.writeSpacer(10);
  }

  H.ensureSpace(150);
  H.writeSubTitle('6. Assinaturas');
  H.writeSpacer();

  H.writeSignatures({
    leftTitle: 'Locatário/Condutor',
    leftName: cliente.nome || 'N/D',
    leftImage: rececao.assinaturaCliente || null,
    rightTitle: 'Locador (Receção)',
    rightName: company.name,
    rightImage: rececao.assinaturaRececao || null
  });

  if (Array.isArray(fotos) && fotos.length) {
    H.ensureSpace(30);
    H.writeSubTitle('Anexo — Fotografias na Devolução');
    H.writeImageGrid(fotos, 'JPEG');
  }

  H.writeSpacer(10);

  // Fotografias de Danos (se foram anexadas via rececao.danosDetalhados)
  try {
    const danos = Array.isArray(rececao.danosDetalhados) ? rececao.danosDetalhados : [];
    const fotosDanos = danos.flatMap(d => Array.isArray(d.fotos) ? d.fotos : []);
    if (fotosDanos.length) {
      H.ensureSpace(30);
      H.writeSubTitle('Anexo — Fotografias de Danos');
      H.writeImageGrid(fotosDanos, 'JPEG');
    }
  } catch {}

  return doc.output('datauristring');
}

/*
   EXEMPLOS DE USO ATUALIZADO
   =========================
   gerarContratoPDF(payload, {
     company: {
       name: 'Minha Rent, Lda.',
       nif: '123456789',
       address: 'Av. Central, 100, Porto',
       email: 'comercial@minharent.pt',
       phone: '912 345 678',
       jurisdiction: 'Porto',
       logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...' // Substitua pelo seu logo
     },
     styles: {
       colors: {
         primary: [50, 150, 250],
         text: [20, 20, 20]
       },
       fonts: {
         default: 'helvetica',
         titleSize: 22
       }
     }
   });
*/