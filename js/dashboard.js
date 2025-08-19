// Dashboard Avançado com Widgets Personalizáveis
class AdvancedDashboard {
  constructor() {
    this.widgets = new Map();
    this.currentTimeFilter = 'month';
    this.draggedWidget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.placeholder = null;
    this.isDragging = false;
    this.initialScrollY = 0;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadDashboardLayout();
    // this.setupDragAndDrop(); // drag desativado
    this.setupWidgetControls();
    this.setupTimeFilter();
    this.setupCustomizeModal();
    // this.setupDragInstructions(); // hint de drag desativado
  }

  setupEventListeners() {
    // Time filter change
    document.getElementById('timeFilter')?.addEventListener('change', (e) => {
      this.currentTimeFilter = e.target.value;
      this.updateAllWidgets();
    });

    // Customize button
    document.getElementById('customizeDashboard')?.addEventListener('click', () => {
      this.showCustomizeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.showCustomizeModal();
      }
    });
  }

  setupDragAndDrop() {
    // Drag & drop desativado
  }

  handleMouseDown(e) {
    const widget = e.target.closest('.widget');
    const dragHandle = e.target.closest('.drag-handle');
    
    // Only allow drag from drag handle or widget header (but not controls)
    if (!widget) return;
    if (e.target.closest('.widget-controls button')) return;
    if (e.target.closest('a, button, input, select, textarea')) return;
    if (!dragHandle && !e.target.closest('.widget-header')) return;

    e.preventDefault();
    this.startDrag(widget, e.clientX, e.clientY);
  }

  handleMouseMove(e) {
    if (!this.draggedWidget || !this.isDragging) return;
    e.preventDefault();
    this.updateDragPosition(e.clientX, e.clientY);
  }

  handleMouseUp(e) {
    if (!this.draggedWidget || !this.isDragging) return;
    this.endDrag();
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    const widget = e.target.closest('.widget');
    const dragHandle = e.target.closest('.drag-handle');
    
    // Only allow drag from drag handle or widget header (but not controls)
    if (!widget) return;
    if (e.target.closest('.widget-controls button')) return;
    if (e.target.closest('a, button, input, select, textarea')) return;
    if (!dragHandle && !e.target.closest('.widget-header')) return;

    e.preventDefault();
    this.startDrag(widget, touch.clientX, touch.clientY);
  }

  handleTouchMove(e) {
    if (!this.draggedWidget || !this.isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.updateDragPosition(touch.clientX, touch.clientY);
  }

  handleTouchEnd(e) {
    if (!this.draggedWidget || !this.isDragging) return;
    this.endDrag();
  }

  startDrag(widget, clientX, clientY) {
    this.draggedWidget = widget;
    this.isDragging = true;
    this.initialScrollY = window.scrollY;
    
    // Get widget's current position
    const rect = widget.getBoundingClientRect();
    
    // Calculate offset from mouse to widget corner (relative to viewport)
    this.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };

    // Create placeholder
    this.createPlaceholder(widget);

    // Setup dragged widget
    widget.classList.add('dragging');
    widget.style.position = 'fixed';
    widget.style.zIndex = '10000';
    widget.style.width = rect.width + 'px';
    widget.style.height = rect.height + 'px';
    widget.style.pointerEvents = 'none';
    widget.style.transition = 'none';
    widget.style.transform = 'rotate(2deg) scale(1.02)';

    // Add drag overlay to container
    document.getElementById('widgetsContainer').classList.add('drag-over');
    
    // Add dragging class to body
    document.body.classList.add('dragging');
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  }

  createPlaceholder(widget) {
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'widget-placeholder';
    this.placeholder.style.cssText = `
      width: ${widget.offsetWidth}px;
      height: ${widget.offsetHeight}px;
      border: 2px dashed var(--primary);
      background: rgba(40, 167, 69, 0.1);
      border-radius: var(--border-radius);
      margin: 0;
      opacity: 0.5;
      transition: none;
      position: relative;
    `;
    
    // Insert placeholder at widget's position
    widget.parentNode.insertBefore(this.placeholder, widget);
  }

  updateDragPosition(clientX, clientY) {
    if (!this.draggedWidget || !this.isDragging) return;

    // Calculate new position (accounting for scroll)
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const x = clientX - this.dragOffset.x + scrollX;
    const y = clientY - this.dragOffset.y + scrollY;

    // Update widget position
    this.draggedWidget.style.left = x + 'px';
    this.draggedWidget.style.top = y + 'px';

    // Update placeholder position
    this.updatePlaceholderPosition(clientX, clientY);
  }

  updatePlaceholderPosition(clientX, clientY) {
    if (!this.placeholder) return;

    const container = document.getElementById('widgetsContainer');
    const containerRect = container.getBoundingClientRect();
    const widgets = Array.from(container.children).filter(child => 
      child.classList.contains('widget') && child !== this.draggedWidget
    );

    // Find the best insertion point based on Y position
    let bestIndex = widgets.length;
    let minDistance = Infinity;

    widgets.forEach((widget, index) => {
      const rect = widget.getBoundingClientRect();
      const widgetCenterY = rect.top + rect.height / 2;
      const distance = Math.abs(clientY - widgetCenterY);

      if (distance < minDistance) {
        minDistance = distance;
        bestIndex = index;
      }
    });

    // Move placeholder to correct position
    if (bestIndex < widgets.length) {
      container.insertBefore(this.placeholder, widgets[bestIndex]);
    } else {
      container.appendChild(this.placeholder);
    }
  }

  endDrag() {
    if (!this.draggedWidget || !this.isDragging) return;

    // Get final position
    const finalIndex = this.getPlaceholderIndex();
    
    // Reset widget styles
    this.draggedWidget.classList.remove('dragging');
    this.draggedWidget.style.position = '';
    this.draggedWidget.style.zIndex = '';
    this.draggedWidget.style.width = '';
    this.draggedWidget.style.height = '';
    this.draggedWidget.style.left = '';
    this.draggedWidget.style.top = '';
    this.draggedWidget.style.pointerEvents = '';
    this.draggedWidget.style.transition = '';
    this.draggedWidget.style.transform = '';

    // Move widget to final position
    if (finalIndex !== -1) {
      const container = document.getElementById('widgetsContainer');
      if (container) {
        const widgets = Array.from(container.children).filter(child => 
          child.classList.contains('widget') && child !== this.draggedWidget
        );
        
        if (finalIndex < widgets.length) {
          container.insertBefore(this.draggedWidget, widgets[finalIndex]);
        } else {
          container.appendChild(this.draggedWidget);
        }
      }
    }

    // Remove placeholder safely
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.remove();
    }
    this.placeholder = null;

    // Cleanup
    const container = document.getElementById('widgetsContainer');
    if (container) {
      container.classList.remove('drag-over');
    }
    
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.body.classList.remove('dragging');
    
    this.draggedWidget = null;
    this.isDragging = false;
    this.initialScrollY = 0;
    
    // Save layout
    this.saveDashboardLayout();
  }

  getPlaceholderIndex() {
    if (!this.placeholder) return -1;
    
    const container = document.getElementById('widgetsContainer');
    const widgets = Array.from(container.children).filter(child => 
      child.classList.contains('widget')
    );
    
    return widgets.indexOf(this.placeholder);
  }

  setupWidgetControls() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('widget-minimize')) {
        const widget = e.target.closest('.widget');
        widget.classList.toggle('minimized');
        this.saveDashboardLayout();
      }

      if (e.target.classList.contains('widget-remove')) {
        const widget = e.target.closest('.widget');
        this.removeWidget(widget);
      }
    });
  }

  setupTimeFilter() {
    const timeFilter = document.getElementById('timeFilter');
    if (!timeFilter) return;

    // Add custom date range option
    timeFilter.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        this.showCustomDateRange();
      }
    });
  }

  showCustomDateRange() {
    const startDate = prompt('Data de início (YYYY-MM-DD):');
    const endDate = prompt('Data de fim (YYYY-MM-DD):');
    
    if (startDate && endDate) {
      this.currentTimeFilter = { start: startDate, end: endDate };
      this.updateAllWidgets();
    } else {
      document.getElementById('timeFilter').value = 'month';
    }
  }

  setupCustomizeModal() {
    const modal = document.getElementById('customizeModal');
    if (!modal) return;

    // Close modal
    modal.querySelector('.modal-close')?.addEventListener('click', () => {
      this.closeCustomizeModal();
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeCustomizeModal();
      }
    });

    // Widget options
    modal.querySelectorAll('.widget-option').forEach(option => {
      option.addEventListener('click', () => {
        option.classList.toggle('selected');
      });
    });
  }

  setupDragInstructions() {
    // Hint de drag desativado
  }

  showCustomizeModal() {
    const modal = document.getElementById('customizeModal');
    if (!modal) return;

    // Mark existing widgets as selected
    const existingWidgets = new Set();
    document.querySelectorAll('.widget').forEach(widget => {
      existingWidgets.add(widget.dataset.widgetType);
    });

    modal.querySelectorAll('.widget-option').forEach(option => {
      const widgetType = option.dataset.widgetType;
      option.classList.toggle('selected', existingWidgets.has(widgetType));
    });

    modal.style.display = 'flex';
  }

  closeCustomizeModal() {
    const modal = document.getElementById('customizeModal');
    if (modal) modal.style.display = 'none';
  }

  saveDashboardLayout() {
    const layout = {
      widgets: Array.from(document.querySelectorAll('.widget')).map(widget => ({
        id: widget.dataset.widgetId,
        type: widget.dataset.widgetType,
        minimized: widget.classList.contains('minimized')
      })),
      timeFilter: this.currentTimeFilter
    };

    try {
      localStorage.setItem('dashboardLayout', JSON.stringify(layout));
    } catch (error) {
      }
  }

  loadDashboardLayout() {
    try {
      const saved = localStorage.getItem('dashboardLayout');
      if (saved) {
        const layout = JSON.parse(saved);
        this.currentTimeFilter = layout.timeFilter || 'month';
        
        // Update time filter select
        const timeFilter = document.getElementById('timeFilter');
        if (timeFilter) timeFilter.value = this.currentTimeFilter;

        // Restore widget states
        layout.widgets?.forEach(widgetData => {
          const widget = document.querySelector(`[data-widget-id="${widgetData.id}"]`);
          if (widget && widgetData.minimized) {
            widget.classList.add('minimized');
          }
        });
      }
    } catch (error) {
      }
  }

  removeWidget(widget) {
    if (confirm('Tem a certeza que quer remover este widget?')) {
      widget.remove();
      this.saveDashboardLayout();
    }
  }

  updateAllWidgets() {
    // Update statistics
    this.updateStatistics();
    
    // Update charts
    this.updateCharts();
    
    // Update recent rentals
    this.updateRecentRentals();
    
    // Update alerts
    this.updateAlerts();
  }

  updateStatistics() {
    // Implementar lógica de estatísticas
    this.loadStatistics();
  }

  async loadStatistics() {
    try {
      if (!window.db) return;
      
      const [veiculosSnap, alugueresSnap] = await Promise.all([
        window.db.ref('veiculos').once('value'),
        window.db.ref('alugueres').once('value')
      ]);
      
      const veiculos = veiculosSnap.val() || {};
      const alugueres = alugueresSnap.val() || {};
      
      const totalVeiculos = Object.keys(veiculos).length;
      const emUso = Object.keys(alugueres).length;
      const disponiveis = totalVeiculos - emUso;
      
      // Atualizar elementos do DOM
      const totalEl = document.getElementById('totalVeiculos');
      const usoEl = document.getElementById('veiculosEmUso');
      const disponiveisEl = document.getElementById('veiculosDisponiveis');
      
      if (totalEl) totalEl.textContent = totalVeiculos;
      if (usoEl) usoEl.textContent = emUso;
      if (disponiveisEl) disponiveisEl.textContent = disponiveis;
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }

  updateCharts() {
    // Update revenue chart
    this.updateRevenueChart();
    
    // Update occupation chart
    this.updateOccupationChart();
  }

  updateRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple line chart
    const data = this.getRevenueData();
    if (data.length === 0) return;

    const padding = 20;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * chartHeight / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = padding + (index * chartWidth / (data.length - 1));
      const y = padding + chartHeight - ((point.value - minValue) / range * chartHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#28a745';
    data.forEach((point, index) => {
      const x = padding + (index * chartWidth / (data.length - 1));
      const y = padding + chartHeight - ((point.value - minValue) / range * chartHeight);
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  getRevenueData() {
    // Mock data - in real implementation, this would come from Firebase
    const periods = {
      today: 7,
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const days = periods[this.currentTimeFilter] || 30;
    const data = [];

    for (let i = 0; i < days; i++) {
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
        value: Math.random() * 1000 + 500
      });
    }

    return data;
  }

  updateOccupationChart() {
    const canvas = document.getElementById('occupationChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Implementar gráfico de ocupação básico
    const totalVeiculos = parseInt(document.getElementById('totalVeiculos')?.textContent || '0');
    const emUso = parseInt(document.getElementById('veiculosEmUso')?.textContent || '0');
    
    if (totalVeiculos === 0) return;
    
    const ocupacao = (emUso / totalVeiculos) * 100;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar gráfico circular simples
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Fundo
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    
    // Ocupação
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (ocupacao / 100) * 2 * Math.PI);
    ctx.lineWidth = 20;
    ctx.strokeStyle = ocupacao > 80 ? '#28a745' : ocupacao > 50 ? '#ffc107' : '#dc3545';
    ctx.stroke();
    
    // Texto central
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${ocupacao.toFixed(1)}%`, centerX, centerY);
  }

  updateRecentRentals() {
    if (!window.db) return;
    
    window.db.ref('alugueres').limitToLast(5).once('value').then(snap => {
      const alugueres = snap.val() || {};
      const recentList = document.getElementById('recentRentalsList');
      if (!recentList) return;
      
      const items = Object.entries(alugueres).map(([id, data]) => ({ id, ...data }));
      
      if (items.length === 0) {
        recentList.innerHTML = '<div class="muted">Nenhum aluguer recente</div>';
        return;
      }
      
      recentList.innerHTML = items.map(item => {
        const cliente = item.cliente?.nome || 'Cliente';
        const veiculo = item.veiculo?.matricula || 'Veículo';
        const data = new Date(item.criadoEm || '').toLocaleDateString('pt-PT');
        
        return `
          <div class="recent-item">
            <div class="recent-item-header">
              <div class="recent-item-title">${cliente}</div>
              <div class="recent-item-status active">Em vigor</div>
            </div>
            <div class="recent-item-details">
              ${veiculo} • ${data}
            </div>
          </div>
        `;
      }).join('');
    }).catch(error => {
      console.error('Erro ao carregar alugueres recentes:', error);
    });
  }

  updateAlerts() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
  
    const baseAlerts = [];
  
    // Regra 1: poucos veículos disponíveis
    const availableVehicles = parseInt(document.getElementById('veiculosDisponiveis')?.textContent || '0');
    if (availableVehicles < 2 && availableVehicles > 0) {
      baseAlerts.push({ type: 'warning', title: 'Poucos veículos disponíveis', message: `Apenas ${availableVehicles} veículos disponíveis` });
    } if (availableVehicles == 0) {
      baseAlerts.push({ type: 'alert', title: 'Nenhum veículo disponíveis', message: `Tem ${availableVehicles} veículos disponíveis` });
    }
  
    // Regra 2: alta ocupação
    const occupationText = document.getElementById('occupationLabel')?.textContent || '0%';
    const occupation = parseFloat(occupationText);
    if (occupation > 80) {
      baseAlerts.push({ type: 'success', title: 'Alta ocupação', message: `Taxa de ocupação de ${occupation}%` });
    }
  
    const render = (alerts) => {
      alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
          <div class="alert-icon">${this.getAlertIcon(alert.type)}</div>
          <div class="alert-content">
            <div class="alert-title">${alert.title}</div>
            <div class="alert-message">${alert.message}</div>
          </div>
        </div>
      `).join('') || '<div class="muted">Nenhum alerta ativo</div>';
    };
  
    if (!window.db) {
      // Ordena antes de renderizar
      const sorted = baseAlerts.sort((a, b) => {
        const priority = { warning: 1, info: 2, success: 3 };
        return priority[a.type] - priority[b.type];
      });
      render(sorted);
      return;
    }
  
    try {
      window.db.ref('alugueres').once('value').then((snap) => {
        const val = snap.val() || {};
        const now = new Date();
        const allAlerts = [...baseAlerts];
  
        const addStartDaysAlert = (dias, item) => {
          const c = item.cliente || {};
          const nome = c.nome || 'Cliente';
          if (dias === 1) {
            return { type: 'alert', title: `Contrato começa amanhã`, message: `O contrato ${item._id} (${nome}) começa amanhã.` };
          }
          return { type: 'success', title: `Contrato começa em ${dias} dias`, message: `Faltam ${dias} dias para o contrato ${item._id} (${nome}) começar.` };
        };
  
        const addEndDaysAlert = (dias, item) => {
          const c = item.cliente || {};
          const nome = c.nome || 'Cliente';
          if (dias === 1) {
            return { type: 'alert', title: `Contrato termina amanhã`, message: `O contrato ${item._id} (${nome}) termina amanhã.` };
          }
          return { type: 'warning', title: `Contrato termina em ${dias} dias`, message: `Faltam ${dias} dias para o contrato ${item._id} (${nome}) terminar.` };
        };
  
        Object.entries(val).forEach(([id, item]) => {
          const a = item.aluguer || {};
  
          if (a.inicio) {
            const inicio = new Date(a.inicio);
            if (!isNaN(inicio.getTime())) {
              const diffInicio = inicio.getTime() - now.getTime();
              const diasInicio = Math.ceil(diffInicio / (24 * 60 * 60 * 1000));
              if ([3, 2, 1].includes(diasInicio)) {
                allAlerts.push(addStartDaysAlert(diasInicio, { _id: id, ...item }));
              }
            }
          }
  
          if (a.fim) {
            const fim = new Date(a.fim);
            if (!isNaN(fim.getTime())) {
              const diffFim = fim.getTime() - now.getTime();
              const diasFim = Math.ceil(diffFim / (24 * 60 * 60 * 1000));
              if ([3, 2, 1].includes(diasFim)) {
                allAlerts.push(addEndDaysAlert(diasFim, { _id: id, ...item }));
              }
            }
          }
        });
  
        // Ordena por prioridade e urgência
      const sorted = allAlerts.sort((a, b) => {
        const priority = { alert: 0, warning: 2, info: 3, success: 1 };
        if (priority[a.type] !== priority[b.type]) {
          return priority[a.type] - priority[b.type];
        }
        return (a.dias ?? 999) - (b.dias ?? 999);
      });
  
        render(sorted);
      }).catch(() => render(baseAlerts));
    } catch {
      render(baseAlerts);
    }
  }  

  getAlertIcon(type) {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅',
      alert: '🛑'
    };
    return icons[type] || 'ℹ️';
  }

  handleResize() {
    // Sem drag & drop
  }
}

// Global functions for modal
window.closeCustomizeModal = function() {
  window.dashboard?.closeCustomizeModal();
};

window.saveDashboardLayout = function() {
  window.dashboard?.saveDashboardLayout();
  window.dashboard?.closeCustomizeModal();
};

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new AdvancedDashboard();
});
