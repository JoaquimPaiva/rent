(function initCache() {
  'use strict';

  // Configuração
  const config = {
    maxSize: 100, // Máximo de itens em cache
    defaultTTL: 5 * 60 * 1000, // 5 minutos
    cleanupInterval: 60 * 1000 // Limpeza a cada minuto
  };

  // Cache em memória
  const cache = new Map();
  let cleanupTimer = null;

  // Estrutura de item do cache
  class CacheItem {
    constructor(key, value, ttl = config.defaultTTL) {
      this.key = key;
      this.value = value;
      this.created = Date.now();
      this.expires = this.created + ttl;
      this.accessCount = 0;
      this.lastAccessed = this.created;
    }

    isExpired() {
      return Date.now() > this.expires;
    }

    access() {
      this.accessCount++;
      this.lastAccessed = Date.now();
      return this.value;
    }

    updateTTL(ttl) {
      this.expires = Date.now() + ttl;
    }
  }

  // Funções principais
  function set(key, value, ttl = config.defaultTTL) {
    if (!key || value === undefined) return false;
    
    try {
      // Limpar se já existe
      if (cache.has(key)) {
        cache.delete(key);
      }
      
      // Verificar limite de tamanho
      if (cache.size >= config.maxSize) {
        evictLRU();
      }
      
      const item = new CacheItem(key, value, ttl);
      cache.set(key, item);
      return true;
    } catch (error) {
      console.warn('Erro ao definir item no cache:', error);
      return false;
    }
  }

  function get(key) {
    if (!key) return null;
    
    try {
      const item = cache.get(key);
      if (!item) return null;
      
      if (item.isExpired()) {
        cache.delete(key);
        return null;
      }
      
      return item.access();
    } catch (error) {
      console.warn('Erro ao obter item do cache:', error);
      return null;
    }
  }

  function has(key) {
    if (!key) return false;
    
    try {
      const item = cache.get(key);
      if (!item) return false;
      
      if (item.isExpired()) {
        cache.delete(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Erro ao verificar item no cache:', error);
      return false;
    }
  }

  function remove(key) {
    if (!key) return false;
    
    try {
      return cache.delete(key);
    } catch (error) {
      console.warn('Erro ao remover item do cache:', error);
      return false;
    }
  }

  function clear() {
    try {
      cache.clear();
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }

  function size() {
    return cache.size;
  }

  function keys() {
    try {
      return Array.from(cache.keys());
    } catch (error) {
      console.warn('Erro ao obter chaves do cache:', error);
      return [];
    }
  }

  // Evicção LRU (Least Recently Used)
  function evictLRU() {
    try {
      let oldestKey = null;
      let oldestTime = Infinity;
      
      for (const [key, item] of cache.entries()) {
        if (item.lastAccessed < oldestTime) {
          oldestTime = item.lastAccessed;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    } catch (error) {
      console.warn('Erro ao evictar item LRU:', error);
    }
  }

  // Limpeza automática de itens expirados
  function cleanup() {
    try {
      const now = Date.now();
      const expiredKeys = [];
      
      for (const [key, item] of cache.entries()) {
        if (item.isExpired()) {
          expiredKeys.push(key);
        }
      }
      
      expiredKeys.forEach(key => cache.delete(key));
      
      // Cache limpo silenciosamente em produção
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }

  // Iniciar limpeza automática
  function startCleanup() {
    if (cleanupTimer) return;
    
    try {
      cleanupTimer = setInterval(cleanup, config.cleanupInterval);
    } catch (error) {
      console.warn('Erro ao iniciar limpeza automática:', error);
    }
  }

  // Parar limpeza automática
  function stopCleanup() {
    if (cleanupTimer) {
      try {
        clearInterval(cleanupTimer);
      } catch (error) {
        console.warn('Erro ao parar limpeza automática:', error);
      }
      cleanupTimer = null;
    }
  }

  // Cache com prefixo para namespaces
  function createNamespace(prefix) {
    return {
      set: (key, value, ttl) => set(`${prefix}:${key}`, value, ttl),
      get: (key) => get(`${prefix}:${key}`),
      has: (key) => has(`${prefix}:${key}`),
      remove: (key) => remove(`${prefix}:${key}`),
      clear: () => {
        try {
          const keysToRemove = keys().filter(key => key.startsWith(`${prefix}:`));
          keysToRemove.forEach(key => cache.delete(key));
        } catch (error) {
          console.warn('Erro ao limpar namespace:', error);
        }
      }
    };
  }

  // Cache para dados do Firebase
  const firebaseCache = createNamespace('firebase');
  
  // Cache para dados de formulários
  const formCache = createNamespace('form');
  
  // Cache para dados de UI
  const uiCache = createNamespace('ui');

  // API pública
  const api = {
    // Métodos básicos
    set,
    get,
    has,
    remove,
    clear,
    size,
    keys,
    
    // Configuração
    config: (newConfig) => Object.assign(config, newConfig),
    
    // Namespaces
    firebase: firebaseCache,
    form: formCache,
    ui: uiCache,
    namespace: createNamespace,
    
    // Gestão
    startCleanup,
    stopCleanup,
    cleanup,
    
    // Estatísticas
    stats: () => {
      try {
        return {
          size: cache.size,
          maxSize: config.maxSize,
          keys: Array.from(cache.keys()),
          items: Array.from(cache.values()).map(item => ({
            key: item.key,
            created: item.created,
            expires: item.expires,
            accessCount: item.accessCount,
            lastAccessed: item.lastAccessed,
            isExpired: item.isExpired()
          }))
        };
      } catch (error) {
        console.warn('Erro ao obter estatísticas do cache:', error);
        return { size: 0, maxSize: config.maxSize, keys: [], items: [] };
      }
    }
  };

  // Expor globalmente
  window.cache = api;

  // Iniciar limpeza automática
  startCleanup();

  // Limpeza na saída da página
  window.addEventListener('beforeunload', () => {
    stopCleanup();
  });

  // Cache para dados persistentes (localStorage)
  const persistentCache = {
    set: (key, value, ttl = 24 * 60 * 60 * 1000) => { // 24h por omissão
      try {
        const item = {
          value,
          created: Date.now(),
          expires: Date.now() + ttl
        };
        localStorage.setItem(`cache:${key}`, JSON.stringify(item));
        return true;
      } catch (error) {
        console.warn('Erro ao definir item no cache persistente:', error);
        return false;
      }
    },
    
    get: (key) => {
      try {
        const data = localStorage.getItem(`cache:${key}`);
        if (!data) return null;
        
        const item = JSON.parse(data);
        if (Date.now() > item.expires) {
          localStorage.removeItem(`cache:${key}`);
          return null;
        }
        
        return item.value;
      } catch (error) {
        console.warn('Erro ao obter item do cache persistente:', error);
        return null;
      }
    },
    
    has: (key) => {
      try {
        const data = localStorage.getItem(`cache:${key}`);
        if (!data) return false;
        
        const item = JSON.parse(data);
        if (Date.now() > item.expires) {
          localStorage.removeItem(`cache:${key}`);
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn('Erro ao verificar item no cache persistente:', error);
        return false;
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(`cache:${key}`);
        return true;
      } catch (error) {
        console.warn('Erro ao remover item do cache persistente:', error);
        return false;
      }
    },
    
    clear: () => {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache:')) {
            localStorage.removeItem(key);
          }
        });
        return true;
      } catch (error) {
        console.warn('Erro ao limpar cache persistente:', error);
        return false;
      }
    }
  };

  // Adicionar cache persistente à API
  api.persistent = persistentCache;

  // Limpeza de cache persistente expirado
  function cleanupPersistent() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const item = JSON.parse(data);
              if (Date.now() > item.expires) {
                localStorage.removeItem(key);
              }
            } catch (error) {
              console.warn('Erro ao processar item do cache persistente:', error);
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar cache persistente:', error);
    }
  }

  // Executar limpeza persistente a cada 5 minutos
  try {
    setInterval(cleanupPersistent, 5 * 60 * 1000);
  } catch (error) {
    console.warn('Erro ao configurar limpeza persistente:', error);
  }
  
  // Executar uma vez no início
  cleanupPersistent();
})();
