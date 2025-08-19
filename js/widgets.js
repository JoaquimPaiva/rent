window.addEventListener("DOMContentLoaded", () => {
  protectPage();
  onAuthReady((user) => {
    const emailSpan = document.getElementById("userEmail");
    if (emailSpan) emailSpan.textContent = user.email || "Utilizador";

    // Estatísticas: total de veículos e em uso
    const totalEl = document.getElementById("totalVeiculos");
    const usoEl = document.getElementById("veiculosEmUso");
    const disponiveisEl = document.getElementById("veiculosDisponiveis");
    const receitaEl = document.getElementById("receitaMes");
    const occupationFill = document.getElementById("occupationFill");
    const occupationLabel = document.getElementById("occupationLabel");

    let totalVeiculos = 0;
    let emUso = 0;
    let receitaMes = 0;

    const updateUi = () => {
      if (totalEl) totalEl.textContent = String(totalVeiculos);
      if (usoEl) usoEl.textContent = String(emUso);
      if (disponiveisEl)
        disponiveisEl.textContent = String(Math.max(0, totalVeiculos - emUso));
      if (receitaEl) receitaEl.textContent = `€${receitaMes.toFixed(2)}`;

      // Atualizar gráfico de ocupação
      if (totalVeiculos > 0 && occupationFill && occupationLabel) {
        const ocupacao = (emUso / totalVeiculos) * 100;
        occupationFill.style.width = `${ocupacao}%`;
        occupationLabel.textContent = `${ocupacao.toFixed(1)}% ocupado`;

        // Atualizar métricas detalhadas
        const occupationCurrent = document.getElementById("occupationCurrent");
        const occupationAverage = document.getElementById("occupationAverage");
        if (occupationCurrent)
          occupationCurrent.textContent = `${ocupacao.toFixed(1)}%`;
        if (occupationAverage)
          occupationAverage.textContent = `${(ocupacao * 0.9).toFixed(1)}%`;
      }

      // Atualizar alertas do dashboard avançado
      if (window.dashboard) {
        window.dashboard.updateAlerts();
      }
    };

    // Carregar dados iniciais
    const loadInitialData = async () => {
      const [veiculosSnap, alugueresSnap] = await Promise.all([
        db.ref("veiculos").once("value"),
        db.ref("alugueres").once("value"),
      ]);

      const veiculos = veiculosSnap.val() || {};
      const alugueres = alugueresSnap.val() || {};

      totalVeiculos = Object.keys(veiculos).length;

      // Calcular veículos em uso
      const usados = new Set();
      for (const [id, contrato] of Object.entries(alugueres)) {
        const vid = contrato.veiculoId;
        const mat = (contrato.veiculo?.matricula || "").trim().toLowerCase();
        if (vid) usados.add(`id:${vid}`);
        else if (mat) usados.add(`mat:${mat}`);
        else usados.add(`k:${id}`);
      }
      emUso = usados.size;

      updateUi();
      loadRecentRentals(alugueres);

      // Atualizar gráfico de receitas
      if (window.dashboard) {
        window.dashboard.updateRevenueChart();
      }
    };

    // Função para calcular receita por período
    const calculateRevenueForPeriod = (alugueres, period) => {
      const agora = new Date();
      let inicioPeriodo, fimPeriodo;

      switch (period) {
        case "today":
          inicioPeriodo = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate()
          );
          fimPeriodo = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate() + 1
          );
          break;
        case "week":
          const dayOfWeek = agora.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          inicioPeriodo = new Date(
            agora.getTime() - daysToMonday * 24 * 60 * 60 * 1000
          );
          inicioPeriodo.setHours(0, 0, 0, 0);
          fimPeriodo = new Date(
            inicioPeriodo.getTime() + 7 * 24 * 60 * 60 * 1000
          );
          break;
        case "month":
          inicioPeriodo = new Date(agora.getFullYear(), agora.getMonth(), 1);
          fimPeriodo = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
          break;
        case "quarter":
          const quarter = Math.floor(agora.getMonth() / 3);
          inicioPeriodo = new Date(agora.getFullYear(), quarter * 3, 1);
          fimPeriodo = new Date(agora.getFullYear(), (quarter + 1) * 3, 0);
          break;
        case "year":
          inicioPeriodo = new Date(agora.getFullYear(), 0, 1);
          fimPeriodo = new Date(agora.getFullYear(), 11, 31);
          break;
        default:
          return 0;
      }

      let receita = 0;
      for (const [, contrato] of Object.entries(alugueres)) {
        const dataInicio = new Date(contrato.aluguer?.inicio || "");
        if (dataInicio >= inicioPeriodo && dataInicio <= fimPeriodo) {
          receita += Number(contrato.aluguer?.precoTotal || 0);
        }
      }

      return receita;
    };

    // Carregar alugueres recentes
    const loadRecentRentals = (alugueres) => {
      const recentList = document.getElementById("recentRentalsList");
      if (!recentList) return;

      const recentes = Object.entries(alugueres)
        .sort(
          ([, a], [, b]) =>
            new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0)
        )
        .slice(0, 5);

      if (recentes.length === 0) {
        recentList.innerHTML =
          '<div class="muted">Nenhum aluguer encontrado</div>';
        return;
      }

      recentList.innerHTML = recentes
        .map(([id, contrato]) => {
          const cliente = contrato.cliente?.nome || "Cliente desconhecido";
          const veiculo = contrato.veiculo?.matricula || "Veículo desconhecido";
          const data = new Date(contrato.criadoEm || "").toLocaleDateString(
            "pt-PT"
          );
          const status =
            new Date(contrato.aluguer?.fim || "") > new Date()
              ? "active"
              : "completed";
          const statusText = status === "active" ? "Em vigor" : "Terminado";

          return `
            <div class="recent-item" onclick="window.location.href='historico.html#${id}'">
              <div class="recent-item-header">
                <div class="recent-item-title">${cliente}</div>
                <div class="recent-item-status ${status}">${statusText}</div>
              </div>
              <div class="recent-item-details">
                ${veiculo} • ${data}
              </div>
            </div>
          `;
        })
        .join("");
    };

    // Carregar dados iniciais
    loadInitialData();

    // Esconder loading quando stats iniciais estiverem prontas
    const p1 = new Promise((resolve) => {
      db.ref("veiculos").once("value").finally(resolve);
    });
    const p2 = new Promise((resolve) => {
      db.ref("alugueres").once("value").finally(resolve);
    });

    window.loading?.when([p1, p2]).then(() => {
      // depois subscrevemos para tempo-real
      db.ref("veiculos").on("value", (snap) => {
        const val = snap.val() || {};
        totalVeiculos = Object.keys(val).length;
        updateUi();
      });

      db.ref("alugueres").on("value", (snap) => {
        const val = snap.val() || {};
        const usados = new Set();

        const timeFilter =
          document.getElementById("timeFilter")?.value || "month";
        receitaMes = calculateRevenueForPeriod(val, timeFilter);

        for (const [id, c] of Object.entries(val)) {
          const vid = c.veiculoId;
          const mat = (c.veiculo?.matricula || "").trim().toLowerCase();
          if (vid) usados.add(`id:${vid}`);
          else if (mat) usados.add(`mat:${mat}`);
          else usados.add(`k:${id}`);
        }
        emUso = usados.size;
        updateUi();
        loadRecentRentals(val);

        // Atualizar gráfico de receitas
        if (window.dashboard) {
          window.dashboard.updateRevenueChart();
        }
      });

      window.dispatchEvent(new Event("page-ready"));
    });
  });
});
