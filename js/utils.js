async function fileToDataURL(file) {
  if (!file || !(file instanceof File)) {
    throw new Error('Ficheiro inválido fornecido');
  }
  
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

async function resizeImageDataURL(dataUrl, maxW = 1280, maxH = 1280) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('URL de dados inválida fornecida');
  }
  
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const ratio = Math.min(maxW / width, maxH / height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            reject(new Error('Não foi possível obter contexto 2D do canvas'));
          }
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

function uuid() {
  try {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  } catch (error) {
    console.warn('Erro ao gerar UUID:', error);
    // Fallback simples
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Helpers de data e formatação
function formatDate(date, options = {}) {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const defaults = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return d.toLocaleDateString('pt-PT', { ...defaults, ...options });
  } catch (error) {
    console.warn('Erro ao formatar data:', error);
    return '';
  }
}

function formatCurrency(amount, currency = 'EUR') {
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00 €';
  
  try {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    console.warn('Erro ao formatar moeda:', error);
    // Fallback simples
    return `${amount.toFixed(2)} €`;
  }
}

function debounce(func, wait) {
  if (typeof func !== 'function') {
    throw new Error('Primeiro argumento deve ser uma função');
  }
  
  if (typeof wait !== 'number' || wait < 0) {
    throw new Error('Segundo argumento deve ser um número positivo');
  }
  
  let timeout;
  return function executedFunction(...args) {
    try {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    } catch (error) {
      console.warn('Erro na função debounced:', error);
    }
  };
}

function throttle(func, limit) {
  if (typeof func !== 'function') {
    throw new Error('Primeiro argumento deve ser uma função');
  }
  
  if (typeof limit !== 'number' || limit < 0) {
    throw new Error('Segundo argumento deve ser um número positivo');
  }
  
  let inThrottle;
  return function() {
    try {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    } catch (error) {
      console.warn('Erro na função throttled:', error);
    }
  };
}

// Helpers de validação
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  } catch (error) {
    console.warn('Erro ao validar email:', error);
    return false;
  }
}

function isValidNIF(nif) {
  if (!nif || typeof nif !== 'string') return false;
  
  try {
    const cleanNIF = nif.replace(/\D/g, '');
    if (cleanNIF.length !== 9 || !/^\d{9}$/.test(cleanNIF)) return false;
    
    // Validação do dígito de controlo do NIF português
    const digits = cleanNIF.split('').map(Number);
    const checksum = digits.slice(0, 8).reduce((sum, digit, index) => {
      return sum + digit * (9 - index);
    }, 0);
    
    const remainder = checksum % 11;
    const checkDigit = remainder < 2 ? 0 : 11 - remainder;
    
    return digits[8] === checkDigit;
  } catch (error) {
    console.warn('Erro ao validar NIF:', error);
    return false;
  }
}

function isValidMatricula(matricula) {
  if (!matricula || typeof matricula !== 'string') return false;
  
  try {
    const cleanMat = matricula.trim().toUpperCase();
    // Formato português: XX-XX-XX onde X pode ser letra ou número
    return /^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/.test(cleanMat);
  } catch (error) {
    console.warn('Erro ao validar matrícula:', error);
    return false;
  }
}

// Helpers de DOM
function createElement(tag, attributes = {}, children = []) {
  try {
    const element = document.createElement(tag);
    
    // Aplicar atributos
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    });
    
    // Adicionar filhos
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    
    return element;
  } catch (error) {
    console.error('Erro ao criar elemento:', error);
    return null;
  }
}

function addEventListeners(element, events) {
  if (!element || !events || typeof events !== 'object') return;
  
  try {
    Object.entries(events).forEach(([event, handler]) => {
      if (typeof handler === 'function') {
        element.addEventListener(event, handler);
      }
    });
  } catch (error) {
    console.warn('Erro ao adicionar event listeners:', error);
  }
}

// Helpers de storage
function safeLocalStorageGet(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.warn('Erro ao ler do localStorage:', error);
    return defaultValue;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Erro ao escrever no localStorage:', error);
    return false;
  }
}

function safeLocalStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('Erro ao remover do localStorage:', error);
    return false;
  }
}

// Helpers de arrays e objetos
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
}

function mergeObjects(target, ...sources) {
  try {
    if (!target || typeof target !== 'object') {
      target = {};
    }
    
    sources.forEach(source => {
      if (source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            target[key] = mergeObjects(target[key] || {}, source[key]);
          } else {
            target[key] = source[key];
          }
        });
      }
    });
    
    return target;
  } catch (error) {
    console.warn('Erro ao fazer merge de objetos:', error);
    return target || {};
  }
}

// Helpers de strings
function truncateString(str, maxLength, suffix = '...') {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  
  try {
    return str.substring(0, maxLength - suffix.length) + suffix;
  } catch (error) {
    console.warn('Erro ao truncar string:', error);
    return str;
  }
}

function capitalizeFirst(str) {
  if (!str || typeof str !== 'string') return '';
  
  try {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  } catch (error) {
    console.warn('Erro ao capitalizar string:', error);
    return str;
  }
}

// Helpers de números
function clamp(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function roundToDecimals(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  
  try {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  } catch (error) {
    console.warn('Erro ao arredondar número:', error);
    return value;
  }
}

// Helpers de async
async function retry(fn, maxAttempts = 3, delay = 1000) {
  if (typeof fn !== 'function') {
    throw new Error('Primeiro argumento deve ser uma função');
  }
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function timeout(promise, ms) {
  if (!promise || typeof promise.then !== 'function') {
    throw new Error('Primeiro argumento deve ser uma Promise');
  }
  
  if (typeof ms !== 'number' || ms < 0) {
    throw new Error('Segundo argumento deve ser um número positivo');
  }
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Expor funções globalmente
window.utils = {
  // Funções principais
  fileToDataURL,
  resizeImageDataURL,
  uuid,
  
  // Formatação
  formatDate,
  formatCurrency,
  
  // Controle de fluxo
  debounce,
  throttle,
  
  // Validação
  isValidEmail,
  isValidNIF,
  isValidMatricula,
  
  // DOM
  createElement,
  addEventListeners,
  
  // Storage
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeLocalStorageRemove,
  
  // Arrays e objetos
  deepClone,
  mergeObjects,
  
  // Strings
  truncateString,
  capitalizeFirst,
  
  // Números
  clamp,
  roundToDecimals,
  
  // Async
  retry,
  timeout
};

// ---- PDF helpers (compatibilidade e simplicidade) ----
function dataUriToBlob(dataUri) {
  if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) {
    throw new Error('dataUri inválido');
  }
  const parts = dataUri.split(',');
  const meta = parts[0] || '';
  const base64 = (parts[1] || '').replace(/\s+/g, '');
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function extractBase64Pdf(dataUriOrBase64) {
  if (!dataUriOrBase64) return '';
  if (typeof dataUriOrBase64 !== 'string') return '';
  if (dataUriOrBase64.startsWith('data:')) {
    return (dataUriOrBase64.split(',')[1] || '').replace(/\s+/g, '');
  }
  return dataUriOrBase64
    .replace(/^data:application\/pdf(?:;filename=[^;]+)?;base64,/, '')
    .replace(/\s+/g, '');
}

function downloadBlob(blob, filename) {
  try {
    // IE/Edge antigo
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
      return;
    }
  } catch {}
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function downloadPdfDataUri(dataUri, filename) {
  try {
    const blob = dataUriToBlob(dataUri);
    downloadBlob(blob, filename);
  } catch (e) {
    // Fallback extremo
    try { window.open(dataUri, '_blank'); } catch {}
  }
}

window.pdfUtils = {
  dataUriToBlob,
  extractBase64Pdf,
  downloadBlob,
  downloadPdfDataUri,
};

// Helpers de imagem adicionais
async function ensureMaxBytesDataURL(dataUrl, maxBytes = 1_500_000, options = {}) {
  // Tenta reduzir qualidade e dimensões progressivamente até ficar abaixo do limite
  const decodeBase64Len = (dataUrlStr) => {
    try {
      const base64 = (dataUrlStr.split(',')[1] || '').replace(/\s+/g, '');
      return atob(base64).length;
    } catch { return dataUrlStr.length; }
  };
  const loadImg = (src) => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });

  try {
    let current = dataUrl;
    if (decodeBase64Len(current) <= maxBytes) return current;

    const img = await loadImg(current);
    let width = img.width;
    let height = img.height;

    // Parâmetros iniciais
    let quality = typeof options.quality === 'number' ? options.quality : 0.6;
    const minQuality = 0.3;
    const minSide = 640; // não descer abaixo disto

    for (let step = 0; step < 10; step++) {
      // Reduzir dimensões se necessário
      if (width > 1280 || height > 1280 || decodeBase64Len(current) > maxBytes) {
        width = Math.max(Math.floor(width * 0.85), minSide);
        height = Math.max(Math.floor(height * 0.85), minSide);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Preferir WebP se suportado
      const tryTypes = ['image/webp', 'image/jpeg'];
      let next = current;
      for (const type of tryTypes) {
        next = canvas.toDataURL(type, quality);
        if (decodeBase64Len(next) <= maxBytes) {
          return next;
        }
      }

      // Reduzir qualidade para próxima iteração
      quality = Math.max(minQuality, quality - 0.1);
      current = next;
      if (width === minSide && height === minSide && quality === minQuality) break;
    }
    return current; // retorna melhor esforço
  } catch {
    return dataUrl; // fallback
  }
}

// Export util novo
window.ensureMaxBytesDataURL = ensureMaxBytesDataURL;

// Pré-carregar logo da app para uso nos PDFs
(function preloadAppLogo(){
  const candidates = ['img/image.png', 'img/image.png'];
  const tryLoad = (src) => new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = 300; const ratio = img.width ? Math.min(1, w / img.width) : 1; const width = Math.round((img.width || w) * ratio); const height = Math.round((img.height || 100) * ratio);
        canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch(e){ reject(e); }
    }; img.onerror = reject; img.src = src; });
  (async () => {
    if (window.appLogoDataURL) return;
    for (const src of candidates) {
      try { window.appLogoDataURL = await tryLoad(src); break; } catch {}
    }
  })();
})();

// Sistema de atalhos de teclado
function initKeyboardShortcuts() {
  const shortcuts = {
    // Navegação
    'Alt+1': () => window.location.href = 'dashboard.html',
    'Alt+2': () => window.location.href = 'novo-aluguer.html',
    'Alt+3': () => window.location.href = 'veiculos.html',
    'Alt+4': () => window.location.href = 'historico.html',
    'Alt+5': () => window.location.href = 'terminados.html',
    
    // Ações rápidas
    'Ctrl+n': (e) => {
      e.preventDefault();
      window.location.href = 'novo-aluguer.html';
    },
    'Ctrl+s': (e) => {
      e.preventDefault();
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
      }
    },
    'Ctrl+f': (e) => {
      e.preventDefault();
      const searchInput = document.querySelector('.search, input[type="search"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    
    // Tema
    'Ctrl+t': (e) => {
      e.preventDefault();
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.click();
      }
    },
    
    // Filtros
    'Ctrl+Shift+f': (e) => {
      e.preventDefault();
      const toggleFilters = document.getElementById('toggleFilters');
      if (toggleFilters) {
        toggleFilters.click();
      }
    },
    
    // Escape para fechar modais
    'Escape': () => {
      const modals = document.querySelectorAll('[aria-hidden="true"]');
      modals.forEach(modal => {
        if (modal.style.display !== 'none') {
          const closeBtn = modal.querySelector('[aria-label="Fechar"], .btn[aria-label="Fechar"]');
          if (closeBtn) closeBtn.click();
        }
      });
    }
  };
  
  // Registrar atalhos
  document.addEventListener('keydown', (e) => {
    const key = [
      e.altKey ? 'Alt+' : '',
      e.ctrlKey ? 'Ctrl+' : '',
      e.shiftKey ? 'Shift+' : '',
      e.key.toUpperCase()
    ].join('');
    
    if (shortcuts[key]) {
      shortcuts[key](e);
    }
  });
  
  // Mostrar atalhos disponíveis
  function showShortcutsHelp() {
    const helpModal = document.createElement('div');
    helpModal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const helpContent = document.createElement('div');
    helpContent.className = 'card';
    helpContent.style.cssText = `
      max-width: 600px;
      max-height: 80vh;
      overflow: auto;
      padding: 24px;
    `;
    
    const shortcutsList = [
      { key: 'Alt + 1-5', desc: 'Navegar entre páginas' },
      { key: 'Ctrl + N', desc: 'Novo aluguer' },
      { key: 'Ctrl + S', desc: 'Submeter formulário' },
      { key: 'Ctrl + F', desc: 'Focar na pesquisa' },
      { key: 'Ctrl + T', desc: 'Alternar tema' },
      { key: 'Ctrl + Shift + F', desc: 'Mostrar/ocultar filtros' },
      { key: 'Escape', desc: 'Fechar modais' }
    ];
    
    helpContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>Atalhos de Teclado</h2>
        <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" class="btn">✕</button>
      </div>
      <div style="display: grid; gap: 12px;">
        ${shortcutsList.map(item => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);">
            <kbd style="background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; font-family: monospace;">${item.key}</kbd>
            <span>${item.desc}</span>
          </div>
        `).join('')}
      </div>
    `;
    
    helpModal.appendChild(helpContent);
    document.body.appendChild(helpModal);
    
    // Fechar ao clicar fora
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.remove();
      }
    });
  }
  
  // Adicionar atalho para mostrar ajuda
  shortcuts['F1'] = (e) => {
    e.preventDefault();
    showShortcutsHelp();
  };
  
  // Mostrar indicador de atalhos disponíveis
  function showShortcutsIndicator() {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: var(--primary);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      z-index: 1000;
      opacity: 0.8;
      transition: opacity 0.2s;
    `;
    indicator.innerHTML = 'F1 - Atalhos';
    indicator.title = 'Clique para ver atalhos de teclado';
    
    indicator.addEventListener('click', showShortcutsHelp);
    indicator.addEventListener('mouseenter', () => indicator.style.opacity = '1');
    indicator.addEventListener('mouseleave', () => indicator.style.opacity = '0.8');
    
    document.body.appendChild(indicator);
    
    // Esconder após 5 segundos
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.opacity = '0';
        setTimeout(() => indicator.remove(), 200);
      }
    }, 5000);
  }
  
  // Mostrar indicador na primeira visita
  if (!localStorage.getItem('shortcutsShown')) {
    setTimeout(showShortcutsIndicator, 2000);
    localStorage.setItem('shortcutsShown', 'true');
  }
}

// Inicializar atalhos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initKeyboardShortcuts);