// Gestão de tema (dark/light) com persistência correta
function setTheme(mode) {
  if (!mode || !['light', 'dark'].includes(mode)) {
    console.warn('Modo de tema inválido:', mode);
    return;
  }
  
  try {
    const root = document.documentElement;
    const themeIcon = document.querySelector('.theme-icon');
    const isDark = mode === 'dark';
    
    root.classList.toggle('dark-mode', isDark);
    
    if (themeIcon) {
      themeIcon.textContent = isDark ? '🌞' : '🌙';
    }
    
    try { 
      localStorage.setItem('theme', mode); 
    } catch (error) {
      console.warn('Erro ao guardar tema no localStorage:', error);
    }
  } catch (error) {
    console.error('Erro ao definir tema:', error);
  }
}

function toggleTheme() {
  try {
    const isDark = document.documentElement.classList.contains('dark-mode');
    setTheme(isDark ? 'light' : 'dark');
  } catch (error) {
    console.error('Erro ao alternar tema:', error);
  }
}

function applyTheme() {
  try {
    let savedTheme = null;
    
    try { 
      savedTheme = localStorage.getItem('theme'); 
    } catch (error) {
      console.warn('Erro ao ler tema do localStorage:', error);
    }
    
    // Preferência do utilizador ou do sistema
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const mode = savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light';
    
    setTheme(mode);
  } catch (error) {
    console.error('Erro ao aplicar tema:', error);
    // Fallback para tema claro
    setTheme('light');
  }
}

// Função para obter tema atual
function getCurrentTheme() {
  try {
    return document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
  } catch (error) {
    console.warn('Erro ao obter tema atual:', error);
    return 'light';
  }
}

// Função para verificar se o tema escuro está ativo
function isDarkMode() {
  try {
    return document.documentElement.classList.contains('dark-mode');
  } catch (error) {
    console.warn('Erro ao verificar modo escuro:', error);
    return false;
  }
}

// Função para aplicar tema baseado na hora do dia
function applyTimeBasedTheme() {
  try {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 20;
    
    // Aplicar tema escuro à noite se não houver preferência salva
    try {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme && isNight) {
        setTheme('dark');
      }
    } catch (error) {
      console.warn('Erro ao verificar tema salvo:', error);
    }
  } catch (error) {
    console.warn('Erro ao aplicar tema baseado na hora:', error);
  }
}

// Função para sincronizar tema entre abas
function syncThemeAcrossTabs() {
  try {
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue);
      }
    });
  } catch (error) {
    console.warn('Erro ao configurar sincronização de tema:', error);
  }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  try {
    applyTheme();
    applyTimeBasedTheme();
    syncThemeAcrossTabs();
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  } catch (error) {
    console.error('Erro ao inicializar gestão de tema:', error);
  }
});

// Expor funções globalmente
window.themeManager = {
  setTheme,
  toggleTheme,
  applyTheme,
  getCurrentTheme,
  isDarkMode,
  applyTimeBasedTheme
};