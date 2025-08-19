document.addEventListener('DOMContentLoaded', () => {
  try {
    const notificationBell = document.getElementById('notification-bell');
    const notificationBadge = document.querySelector('.notification-badge');

    // Sistema de notificações toast melhorado
    const createToastSystem = () => {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
      return container;
    };

    const showToast = (message, type = 'info', duration = 4000) => {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = createToastSystem();
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.style.cssText = `
        background: var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'primary'});
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        pointer-events: auto;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
      `;
      toast.textContent = message;

      container.appendChild(toast);

      // Auto remove
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = 'slideOutRight 0.3s ease-in';
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);

      // Click to dismiss
      toast.addEventListener('click', () => {
        if (toast.parentNode) {
          toast.style.animation = 'slideOutRight 0.3s ease-in';
          setTimeout(() => toast.remove(), 300);
        }
      });
    };

    // Expor globalmente
    window.notifications = {
      success: (msg) => showToast(msg, 'success'),
      error: (msg) => showToast(msg, 'error'),
      warning: (msg) => showToast(msg, 'warning'),
      info: (msg) => showToast(msg, 'info')
    };

    let notifications = []; // Array para armazenar as notificações
    let popup = null; // Referência ao popup

    // Função para atualizar o contador de notificações
    function updateNotificationCount() {
      try {
        const count = notifications.length;
        if (notificationBadge) {
          notificationBadge.textContent = count > 0 ? count : '';
          notificationBadge.style.display = count > 0 ? 'flex' : 'none';
        }
      } catch (error) {
        console.warn('Erro ao atualizar contador de notificações:', error);
      }
    }

    // Função para obter os alertas do dashboard
    function getDashboardAlerts() {
      try {
        const alerts = [];
        
        // Regra 1: poucos veículos disponíveis
        const veiculosElement = document.getElementById('veiculosDisponiveis');
        if (veiculosElement) {
          const availableVehicles = parseInt(veiculosElement.textContent || '0');
          if (availableVehicles < 2 && availableVehicles > 0) {
            alerts.push({ 
              type: 'warning', 
              title: 'Poucos veículos disponíveis', 
              message: `Apenas ${availableVehicles} veículos disponíveis`,
              timestamp: new Date()
            });
          } 
          if (availableVehicles === 0) {
            alerts.push({ 
              type: 'alert', 
              title: 'Nenhum veículo disponível', 
              message: `Tem ${availableVehicles} veículos disponíveis`,
              timestamp: new Date()
            });
          }
        }

        // Regra 2: alta ocupação
        const occupationElement = document.getElementById('occupationLabel');
        if (occupationElement) {
          const occupationText = occupationElement.textContent || '0%';
          const occupation = parseFloat(occupationText);
          if (occupation > 80) {
            alerts.push({ 
              type: 'success', 
              title: 'Alta ocupação', 
              message: `Taxa de ocupação de ${occupation}%`,
              timestamp: new Date()
            });
          }
        }

        // Se não houver Firebase, retornar apenas os alertas base
        if (!window.db) {
          return alerts;
        }

        // Adicionar alertas baseados nos alugueres
        try {
          // Esta função será chamada quando os dados do Firebase estiverem disponíveis
          // Por enquanto, retornamos os alertas base
          return alerts;
        } catch (error) {
          console.warn('Erro ao obter alertas do Firebase:', error);
          return alerts;
        }
      } catch (error) {
        console.error('Erro ao obter alertas do dashboard:', error);
        return [];
      }
    }

    // Função para atualizar as notificações com base nos alertas do dashboard
    function updateNotificationsFromDashboard() {
      try {
        notifications = getDashboardAlerts();
        updateNotificationCount();
        
        // Se o popup estiver aberto, atualizar a lista
        if (popup && popup.style.display === 'block') {
          renderNotifications();
        }
      } catch (error) {
        console.error('Erro ao atualizar notificações do dashboard:', error);
      }
    }

    // Função para criar o popup de notificações
    function createNotificationPopup() {
      if (popup) return popup;

      try {
        popup = document.createElement('div');
        popup.id = 'notification-popup';
        popup.style.cssText = `
          position: absolute;
          top: 100%;
          right: 0;
          width: 320px;
          max-height: 400px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          display: none;
          overflow: hidden;
          margin-top: 8px;
        `;

        // Adicionar seta apontando para cima
        const arrow = document.createElement('div');
        arrow.style.cssText = `
          position: absolute;
          top: -8px;
          right: 20px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid var(--panel);
        `;
        popup.appendChild(arrow);

        // Header do popup
        const header = document.createElement('div');
        header.style.cssText = `
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Notificações';
        title.style.cssText = 'margin: 0; font-size: 16px; font-weight: 600;';
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Limpar';
        clearBtn.style.cssText = `
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
        `;
        clearBtn.addEventListener('click', () => {
          try {
            notifications = [];
            updateNotificationCount();
            renderNotifications();
          } catch (error) {
            console.warn('Erro ao limpar notificações:', error);
          }
        });
        
        header.appendChild(title);
        header.appendChild(clearBtn);
        popup.appendChild(header);

        // Container das notificações
        const notificationsContainer = document.createElement('div');
        notificationsContainer.id = 'notifications-container';
        notificationsContainer.style.cssText = `
          max-height: 300px;
          overflow-y: auto;
          padding: 8px;
        `;
        popup.appendChild(notificationsContainer);

        return popup;
      } catch (error) {
        console.error('Erro ao criar popup de notificações:', error);
        return null;
      }
    }

    // Função para renderizar as notificações
    function renderNotifications() {
      try {
        if (!popup) return;
        
        const container = popup.querySelector('#notifications-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (notifications.length === 0) {
          const emptyMessage = document.createElement('div');
          emptyMessage.textContent = 'Nenhuma notificação';
          emptyMessage.style.cssText = `
            text-align: center;
            padding: 20px;
            color: var(--text-muted);
            font-style: italic;
          `;
          container.appendChild(emptyMessage);
          return;
        }
        
        notifications.forEach((notification, index) => {
          try {
            const notificationElement = createNotificationElement(notification, index);
            if (notificationElement) {
              container.appendChild(notificationElement);
            }
          } catch (error) {
            console.warn('Erro ao renderizar notificação:', error);
          }
        });
      } catch (error) {
        console.error('Erro ao renderizar notificações:', error);
      }
    }

    // Função para criar elemento de notificação individual
    function createNotificationElement(notification, index) {
      try {
        const element = document.createElement('div');
        element.className = 'notification-item';
        element.style.cssText = `
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          background: var(--background);
          border-left: 4px solid var(--${notification.type || 'info'});
          cursor: pointer;
          transition: background-color 0.2s;
        `;
        
        const title = document.createElement('div');
        title.textContent = notification.title || 'Notificação';
        title.style.cssText = `
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--text);
        `;
        
        const message = document.createElement('div');
        message.textContent = notification.message || '';
        message.style.cssText = `
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 8px;
        `;
        
        const timestamp = document.createElement('div');
        timestamp.textContent = formatNotificationTime(notification.timestamp);
        timestamp.style.cssText = `
          font-size: 12px;
          color: var(--text-muted);
        `;
        
        element.appendChild(title);
        element.appendChild(message);
        element.appendChild(timestamp);
        
        // Adicionar evento de clique
        element.addEventListener('click', () => {
          try {
            handleNotificationClick(notification, index);
          } catch (error) {
            console.warn('Erro ao processar clique na notificação:', error);
          }
        });
        
        return element;
      } catch (error) {
        console.warn('Erro ao criar elemento de notificação:', error);
        return null;
      }
    }

    // Função para formatar tempo da notificação
    function formatNotificationTime(timestamp) {
      try {
        if (!timestamp) return '';
        
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `Há ${diffMins} min`;
        if (diffHours < 24) return `Há ${diffHours}h`;
        if (diffDays < 7) return `Há ${diffDays} dias`;
        
        return time.toLocaleDateString('pt-PT');
      } catch (error) {
        console.warn('Erro ao formatar tempo da notificação:', error);
        return '';
      }
    }

    // Função para lidar com clique na notificação
    function handleNotificationClick(notification, index) {
      try {
        // Remover notificação ao clicar
        notifications.splice(index, 1);
        updateNotificationCount();
        renderNotifications();
        
        // Aqui pode adicionar lógica específica baseada no tipo de notificação
        if (notification.type === 'alert') {
          // Redirecionar para página relevante
          console.log('Notificação de alerta clicada:', notification);
        }
      } catch (error) {
        console.warn('Erro ao processar clique na notificação:', error);
      }
    }

    // Função para mostrar popup
    function showNotificationPopup() {
      try {
        if (!popup) {
          popup = createNotificationPopup();
          if (!popup) return;
          
          // Adicionar ao DOM
          const parent = notificationBell.parentElement;
          if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(popup);
          }
        }
        
        popup.style.display = 'block';
        renderNotifications();
      } catch (error) {
        console.error('Erro ao mostrar popup de notificações:', error);
      }
    }

    // Função para esconder popup
    function hideNotificationPopup() {
      try {
        if (popup) {
          popup.style.display = 'none';
        }
      } catch (error) {
        console.warn('Erro ao esconder popup de notificações:', error);
      }
    }

    // Event listeners
    if (notificationBell) {
      notificationBell.addEventListener('click', (e) => {
        try {
          e.stopPropagation();
          if (popup && popup.style.display === 'block') {
            hideNotificationPopup();
          } else {
            showNotificationPopup();
          }
        } catch (error) {
          console.error('Erro no clique do sino de notificações:', error);
        }
      });
    }

    // Esconder popup ao clicar fora
    document.addEventListener('click', (e) => {
      try {
        if (popup && !popup.contains(e.target) && !notificationBell.contains(e.target)) {
          hideNotificationPopup();
        }
      } catch (error) {
        console.warn('Erro ao processar clique fora do popup:', error);
      }
    });

    // Atualizar notificações periodicamente
    setInterval(() => {
      try {
        updateNotificationsFromDashboard();
      } catch (error) {
        console.warn('Erro ao atualizar notificações periodicamente:', error);
      }
    }, 30000); // A cada 30 segundos

    // Atualização inicial
    updateNotificationsFromDashboard();
    
  } catch (error) {
    console.error('Erro ao inicializar sistema de notificações:', error);
  }
});
