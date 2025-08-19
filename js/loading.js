(function initGlobalLoading() {
  const createOverlay = () => {
    try {
      const el = document.createElement('div');
      el.id = 'globalLoadingOverlay';
      el.setAttribute('aria-busy', 'true');
      el.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:10000',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'background:rgba(0,0,0,0.35)',
        'backdrop-filter:saturate(150%) blur(2px)',
        'transition:opacity .2s ease',
      ].join(';');

      const panel = document.createElement('div');
      panel.style.cssText = [
        'background:var(--panel, #fff)',
        'color:var(--text, #222)',
        'padding:16px 20px',
        'border-radius:10px',
        'box-shadow:0 8px 30px rgba(0,0,0,.2)',
        'display:flex',
        'align-items:center',
        'gap:12px',
        'min-width:220px',
        'justify-content:center',
      ].join(';');

      const spinner = document.createElement('div');
      spinner.style.cssText = [
        'width:22px',
        'height:22px',
        'border-radius:50%',
        'border:3px solid rgba(0,0,0,.15)',
        'border-top-color:var(--primary, #28a745)',
        'animation:glspin .8s linear infinite',
      ].join(';');

      const label = document.createElement('div');
      label.textContent = 'A carregar...';
      label.style.cssText = 'font-weight:600; letter-spacing:.2px;';

      panel.appendChild(spinner);
      panel.appendChild(label);
      el.appendChild(panel);

      const style = document.createElement('style');
      style.textContent = '@keyframes glspin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
      return el;
    } catch (error) {
      console.error('Erro ao criar overlay de loading:', error);
      return null;
    }
  };

  const overlay = createOverlay();
  
  const show = () => {
    try {
      if (!overlay) return;
      
      if (!document.body.contains(overlay)) {
        document.body.appendChild(overlay);
      }
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
    } catch (error) {
      console.warn('Erro ao mostrar overlay de loading:', error);
    }
  };
  
  const hide = () => {
    try {
      if (!overlay) return;
      
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => {
        try {
          if (overlay && overlay.parentNode) {
            overlay.remove();
          }
        } catch (error) {
          console.warn('Erro ao remover overlay:', error);
        }
      }, 250);
    } catch (error) {
      console.warn('Erro ao esconder overlay de loading:', error);
    }
  };

  // Estados de loading por elemento
  const elementLoaders = new Map();
  
  function setElementLoading(element, isLoading, message = 'A carregar...') {
    if (!element) return;
    
    try {
      if (isLoading) {
        if (elementLoaders.has(element)) return; // Já está a carregar
        
        const loader = document.createElement('div');
        loader.className = 'element-loader';
        loader.style.cssText = `
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border-radius: inherit;
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-top: 2px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        `;
        
        const text = document.createElement('div');
        text.textContent = message;
        text.style.cssText = `
          margin-left: 8px;
          font-size: 14px;
          color: var(--text);
        `;
        
        loader.appendChild(spinner);
        loader.appendChild(text);
        
        element.style.position = 'relative';
        element.appendChild(loader);
        element.classList.add('loading');
        elementLoaders.set(element, loader);
        
      } else {
        const loader = elementLoaders.get(element);
        if (loader) {
          try {
            loader.remove();
          } catch (error) {
            console.warn('Erro ao remover loader:', error);
          }
          elementLoaders.delete(element);
          element.classList.remove('loading');
        }
      }
    } catch (error) {
      console.warn('Erro ao definir loading do elemento:', error);
    }
  }

  // API pública
  window.loading = {
    show,
    hide,
    // Permite esconder quando todas as promessas resolvem
    when: async (promises) => {
      if (!Array.isArray(promises) || promises.length === 0) return;
      
      try { 
        show(); 
        await Promise.all(promises); 
      } catch (error) {
        console.warn('Erro durante loading de promessas:', error);
      } finally { 
        hide(); 
      }
    },
    // Loading por elemento
    element: setElementLoading,
    // Loading por botão
    button: (button, isLoading, text = 'A carregar...') => {
      if (!button) return;
      
      try {
        if (isLoading) {
          button.disabled = true;
          button.dataset.originalText = button.textContent;
          button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              ${text}
            </div>
          `;
        } else {
          button.disabled = false;
          if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
          }
        }
      } catch (error) {
        console.warn('Erro ao definir loading do botão:', error);
        // Fallback: apenas desabilitar/habilitar
        try {
          button.disabled = isLoading;
        } catch {}
      }
    }
  };

  // Mostrar assim que o DOM estiver disponível
  const start = () => {
    try {
      show();
    } catch (error) {
      console.warn('Erro ao mostrar loading inicial:', error);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Esconder apenas quando a página sinalizar readiness
  let hidden = false;
  const maybeHide = () => { 
    if (!hidden) { 
      hidden = true; 
      hide(); 
    } 
  };
  
  try {
    window.addEventListener('page-ready', maybeHide, { once: true });
  } catch (error) {
    console.warn('Erro ao configurar evento page-ready:', error);
  }
  
  // Fallback: esconder após um tempo máximo
  setTimeout(() => {
    if (!hidden) {
      hidden = true;
      hide();
    }
  }, 10000); // Máximo 10 segundos
})();

