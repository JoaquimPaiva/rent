// PWA Manager - Gerir instalação e funcionalidades da Progressive Web App
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.updateButton = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkInstallationStatus();
    this.registerServiceWorker();
    this.setupNetworkStatus();
    // this.setupUpdateCheck(); // removido: método inexistente
  }

  setupEventListeners() {
    // Detectar prompt de instalação
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Detectar instalação
    window.addEventListener("appinstalled", () => {
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;

      // Mostrar mensagem de sucesso
      this.showNotification("App instalado com sucesso!", "success");
    });

    // Detectar mudanças de conectividade
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.updateOnlineStatus(true);
      this.syncOfflineData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.updateOnlineStatus(false);
    });

    // Detectar mudanças de visibilidade da página
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  }

  setupNetworkStatus() {
    // Criar indicador de status online/offline
    const statusIndicator = document.createElement("div");
    statusIndicator.id = "network-status";
    statusIndicator.className = "network-status";
    statusIndicator.innerHTML = `
      <div class="status-dot ${this.isOnline ? "online" : "offline"}"></div>
      <span class="status-text">${this.isOnline ? "Online" : "Offline"}</span>
      <a href="logout.html" class="btn danger logoutMobile">Logout</a>
    `;

    // Adicionar ao header se existir
    const header =
      document.querySelector(".online") || document.querySelector(".header");
    if (header) {
      header.appendChild(statusIndicator);
    }

    // Adicionar estilos CSS
    this.addNetworkStatusStyles();
  }

  addNetworkStatusStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .network-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 20px;
        background: var(--panel);
        /*border: 1px solid var(--border);*/
        font-size: 14px;
        color: var(--text);
      }
      
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        animation: pulse 2s infinite;
      }
      
      .status-dot.offline {
        background: #ef4444;
        animation: none;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .install-prompt {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: none;
        animation: slideIn 0.3s ease-out;
      }
      
      .install-prompt.show {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .install-prompt button {
        background: white;
        color: var(--primary);
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .install-prompt button:hover {
        background: #f3f4f6;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      .update-available {
        background: #f59e0b;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin: 16px;
        text-align: center;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .update-available:hover {
        background: #d97706;
      }
    `;
    document.head.appendChild(style);
  }

  updateOnlineStatus(isOnline) {
    const statusIndicator = document.getElementById("network-status");
    if (statusIndicator) {
      const dot = statusIndicator.querySelector(".status-dot");
      const text = statusIndicator.querySelector(".status-text");

      if (dot && text) {
        dot.className = `status-dot ${isOnline ? "online" : "offline"}`;
        text.textContent = isOnline ? "Online" : "Offline";
      }
    }
  }

  showInstallButton() {
    // Criar botão de instalação se não existir
    if (!this.installButton) {
      this.installButton = document.createElement("div");
      this.installButton.className = "install-prompt";
      this.installButton.innerHTML = `
        <span>Instalar app</span>
        <button onclick="window.pwaManager.installApp()">Instalar</button>
        <button onclick="window.pwaManager.hideInstallButton()">✕</button>
      `;
      document.body.appendChild(this.installButton);
    }

    this.installButton.classList.add("show");
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.classList.remove("show");
    }
  }

  async installApp() {
    if (!this.deferredPrompt) {
      return;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      this.deferredPrompt = null;
      this.hideInstallButton();
    } catch (error) {
      // Erro silencioso em produção
    }
  }

  checkInstallationStatus() {
    // Verificar se a app está instalada
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      this.isInstalled = true;
    }
  }

  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("sw.js");

        // Verificar atualizações
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.showUpdateButton();
            }
          });
        });

        // Gerir mensagens do Service Worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "UPDATE_AVAILABLE") {
            this.showUpdateButton();
          }
        });
      } catch (error) {
        // Erro silencioso em produção
      }
    } else {
      // Service Worker não suportado
    }
  }

  showUpdateButton() {
    if (!this.updateButton) {
      this.updateButton = document.createElement("div");
      this.updateButton.className = "update-available";
      this.updateButton.innerHTML =
        "🔄 Nova versão disponível. Clique para atualizar.";
      this.updateButton.onclick = () => this.updateApp();

      // Adicionar no topo da página
      const main = document.querySelector("main") || document.body;
      main.insertBefore(this.updateButton, main.firstChild);
    }
  }

  async updateApp() {
    if (navigator.serviceWorker.controller) {
      // Enviar mensagem para o Service Worker atualizar
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });

      // Recarregar a página após atualização
      window.location.reload();
    }
  }

  checkForUpdates() {
    // Verificar se há atualizações disponíveis
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" });
    }
  }

  async syncOfflineData() {
    // Sincronizar dados offline quando voltar a estar online
    if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ("sync" in registration) {
          await registration.sync.register("background-sync");
        }
      } catch (error) {
        // Erro silencioso em produção
      }
    }
  }

  showNotification(message, type = "info") {
    // Criar notificação toast
    const notification = document.createElement("div");
    notification.className = `toast-notification ${type}`;
    notification.textContent = message;

    // Adicionar estilos se não existirem
    if (!document.querySelector("#toast-styles")) {
      const style = document.createElement("style");
      style.id = "toast-styles";
      style.textContent = `
        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 16px 24px;
          border-radius: 8px;
          color: white;
          z-index: 10000;
          animation: slideInRight 0.3s ease-out;
        }
        
        .toast-notification.success { background: #10b981; }
        .toast-notification.error { background: #ef4444; }
        .toast-notification.info { background: #3b82f6; }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remover após 3 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Método para solicitar permissões de notificação
  async requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        this.showNotification("Notificações ativadas!", "success");
      }
    }
  }

  // Método para enviar notificação local
  sendLocalNotification(title, options = {}) {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        icon: "img/Icon-192x192.png",
        badge: "img/Icon-72x72.png",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
  }
}

// Inicializar PWA Manager quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  window.pwaManager = new PWAManager();

  // Solicitar permissão de notificação após interação do utilizador
  document.addEventListener(
    "click",
    () => {
      if (window.pwaManager) {
        window.pwaManager.requestNotificationPermission();
      }
    },
    { once: true }
  );
});

// Exportar para uso global
window.PWAManager = PWAManager;
