(function initAnalytics() {
  'use strict';

  // Configuração
  const config = {
    enabled: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
    maxEvents: 100,
    flushInterval: 5 * 60 * 1000, // 5 minutos
    endpoint: null // URL para enviar dados (opcional)
  };

  // Estados
  let sessionId = null;
  let sessionStart = null;
  let events = [];
  let flushTimer = null;
  let isOnline = navigator.onLine;

  // Gerar ID de sessão
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Iniciar sessão
  function startSession() {
    sessionId = generateSessionId();
    sessionStart = Date.now();
    
    // Guardar no localStorage para persistência
    try {
      localStorage.setItem('analytics_session', JSON.stringify({
        id: sessionId,
        start: sessionStart
      }));
    } catch (error) {
      console.warn('Erro ao guardar sessão no localStorage:', error);
    }
    
    track('session_start', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }

  // Recuperar sessão existente
  function restoreSession() {
    try {
      const data = localStorage.getItem('analytics_session');
      if (data) {
        const session = JSON.parse(data);
        const sessionAge = Date.now() - session.start;
        
        // Se a sessão não expirou, restaurar
        if (sessionAge < config.sessionTimeout) {
          sessionId = session.id;
          sessionStart = session.start;
          return true;
        }
      }
    } catch (error) {
      console.warn('Erro ao restaurar sessão:', error);
    }
    
    return false;
  }

  // Rastrear evento
  function track(eventName, properties = {}) {
    if (!config.enabled || !sessionId) return;
    
    const event = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: sessionId,
        sessionAge: Date.now() - sessionStart,
        url: window.location.href,
        referrer: document.referrer
      }
    };
    
    events.push(event);
    
    // Limitar número de eventos
    if (events.length > config.maxEvents) {
      events.shift();
    }
    
    // Guardar no localStorage
    try {
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Erro ao guardar eventos no localStorage:', error);
    }
    
    // Log local removido em produção
  }

  // Rastrear navegação
  function trackPageView(page = null) {
    track('page_view', {
      page: page || window.location.pathname,
      title: document.title
    });
  }

  // Rastrear interação
  function trackInteraction(element, action, properties = {}) {
    if (!element) return;
    
    track('interaction', {
      action: action,
      element: element.tagName?.toLowerCase() || 'unknown',
      id: element.id || null,
      className: element.className || null,
      text: element.textContent?.substring(0, 50) || null,
      ...properties
    });
  }

  // Rastrear erro
  function trackError(error, context = {}) {
    if (!error) return;
    
    track('error', {
      message: error.message || String(error),
      stack: error.stack || null,
      ...context
    });
  }

  // Rastrear performance
  function trackPerformance() {
    if ('performance' in window) {
      try {
        const perf = performance.getEntriesByType('navigation')[0];
        if (perf) {
          track('performance', {
            loadTime: perf.loadEventEnd - perf.loadEventStart,
            domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || null,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || null
          });
        }
      } catch (error) {
        console.warn('Erro ao rastrear performance:', error);
      }
    }
  }

  // Enviar eventos para servidor
  async function flushEvents() {
    if (!config.endpoint || events.length === 0) return;
    
    const eventsToSend = [...events];
    events = [];
    
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          events: eventsToSend
        })
      });
      
      if (response.ok) {
        // Limpar localStorage após envio bem-sucedido
        try {
          localStorage.removeItem('analytics_events');
        } catch (error) {
          console.warn('Erro ao limpar eventos do localStorage:', error);
        }
      } else {
        // Recolocar eventos se falhou
        events.unshift(...eventsToSend);
        console.warn('Falha ao enviar eventos para servidor:', response.status);
      }
    } catch (error) {
      // Recolocar eventos se falhou
      events.unshift(...eventsToSend);
      console.warn('Erro ao enviar eventos para servidor:', error);
    }
  }

  // Iniciar flush automático
  function startFlushTimer() {
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(flushEvents, config.flushInterval);
  }

  // Parar flush automático
  function stopFlushTimer() {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
  }

  // Obter estatísticas
  function getStats() {
    const eventCounts = {};
    events.forEach(event => {
      eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
    });
    
    return {
      sessionId,
      sessionStart,
      sessionAge: Date.now() - sessionStart,
      totalEvents: events.length,
      eventCounts,
      isOnline
    };
  }

  // API pública
  const api = {
    track,
    trackPageView,
    trackInteraction,
    trackError,
    trackPerformance,
    flush: flushEvents,
    getStats,
    config: (newConfig) => Object.assign(config, newConfig),
    enable: () => { config.enabled = true; },
    disable: () => { config.enabled = false; }
  };

  // Expor globalmente
  window.analytics = api;

  // Inicialização
  function init() {
    try {
      // Restaurar sessão existente ou criar nova
      if (!restoreSession()) {
        startSession();
      }
      
      // Restaurar eventos do localStorage
      try {
        const savedEvents = localStorage.getItem('analytics_events');
        if (savedEvents) {
          events = JSON.parse(savedEvents);
        }
      } catch (error) {
        console.warn('Erro ao restaurar eventos do localStorage:', error);
        events = [];
      }
      
      // Rastrear página inicial
      trackPageView();
      
      // Rastrear performance após carregamento
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackPerformance);
      } else {
        trackPerformance();
      }
      
      // Iniciar flush automático se online
      if (isOnline) {
        startFlushTimer();
      }
    } catch (error) {
      console.error('Erro ao inicializar analytics:', error);
    }
  }

  // Event listeners
  window.addEventListener('online', () => {
    isOnline = true;
    startFlushTimer();
    track('connection_change', { status: 'online' });
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    stopFlushTimer();
    track('connection_change', { status: 'offline' });
  });

  window.addEventListener('beforeunload', () => {
    if (sessionStart) {
      track('session_end', { sessionAge: Date.now() - sessionStart });
    }
    flushEvents();
  });

  // Rastrear cliques automaticamente
  document.addEventListener('click', (e) => {
    try {
      const target = e.target.closest('button, a, [role="button"]');
      if (target) {
        trackInteraction(target, 'click', {
          href: target.href || null,
          type: target.type || null
        });
      }
    } catch (error) {
      console.warn('Erro ao rastrear clique:', error);
    }
  });

  // Rastrear mudanças de página (SPA)
  let currentUrl = window.location.href;
  const observer = new MutationObserver(() => {
    try {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        trackPageView();
      }
    } catch (error) {
      console.warn('Erro ao rastrear mudança de página:', error);
    }
  });

  try {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (error) {
    console.warn('Erro ao configurar observer de mudanças de página:', error);
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Rastrear erros globais
  window.addEventListener('error', (e) => {
    try {
      trackError(e.error || new Error(e.message), {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      });
    } catch (error) {
      console.warn('Erro ao rastrear erro global:', error);
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    try {
      trackError(new Error(e.reason), {
        type: 'unhandledrejection'
      });
    } catch (error) {
      console.warn('Erro ao rastrear rejeição não tratada:', error);
    }
  });
})();
