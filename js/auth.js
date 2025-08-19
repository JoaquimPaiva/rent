function onAuthReady(callback) {
  if (!auth) {
    console.warn('Firebase Auth não está disponível');
    return () => {};
  }
  
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) callback(user);
  });
  return unsubscribe;
}

let authRedirectTimerId = null;

function protectPage() {
  if (!auth) {
    console.warn('Firebase Auth não está disponível');
    return;
  }

  auth.onAuthStateChanged((user) => {
    const path = (location.pathname || '').toLowerCase();
    const isLogin = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('/index');
    
    if (user) {
      // Verificar expiração programada
      const now = Date.now();
      let exp = Number(localStorage.getItem('sessionExpiryMs') || 0);
      
      if (!Number.isFinite(exp) || exp <= 0) {
        // Primeira sessão: define próximo boundary e não força sign-out
        exp = getNextBoundaryMs();
        try { 
          localStorage.setItem('sessionExpiryMs', String(exp)); 
        } catch (error) {
          console.warn('Erro ao guardar expiração da sessão:', error);
        }
      }
      
      if (now >= exp) {
        try { 
          localStorage.removeItem('sessionExpiryMs'); 
        } catch (error) {
          console.warn('Erro ao remover expiração da sessão:', error);
        }
        auth.signOut().finally(() => { 
          if (!isLogin) window.location.href = 'index.html'; 
        });
        return;
      }
      
      // Se estiver na página de login e já autenticado, redireciona para o dashboard
      if (isLogin) {
        scheduleExpirySignOut(exp);
        window.location.href = 'dashboard.html';
        return;
      }
      
      // Agendar auto sign-out no boundary
      scheduleExpirySignOut(exp);
      
      if (authRedirectTimerId) { 
        try { 
          clearTimeout(authRedirectTimerId); 
        } catch (error) {
          console.warn('Erro ao limpar timer de redirecionamento:', error);
        }
        authRedirectTimerId = null; 
      }
      return;
    }
    
    // Sem utilizador: dá uma pequena margem para o Firebase restaurar sessão
    if (!isLogin) {
      if (authRedirectTimerId) { 
        try { 
          clearTimeout(authRedirectTimerId); 
        } catch (error) {
          console.warn('Erro ao limpar timer de redirecionamento:', error);
        }
      }
      authRedirectTimerId = setTimeout(() => {
        if (!auth.currentUser) {
          window.location.href = 'index.html';
        }
      }, 800);
    }
  });
}

// Login page logic
(function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  
  try {
    protectPage();
  } catch (error) {
    console.error('Erro ao proteger página:', error);
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const errorP = document.getElementById('loginError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email || !password) {
      if (errorP) {
        errorP.textContent = 'Por favor, preencha todos os campos';
        errorP.hidden = false;
      }
      return;
    }
    
    if (errorP) errorP.hidden = true;
    
    try {
      if (window.loading?.button) {
        window.loading.button(submitBtn, true, 'A entrar...');
      }
      
      await auth.signInWithEmailAndPassword(email, password);
      
      // Definir expiração para o próximo boundary (12:00 ou 00:00)
      try { 
        localStorage.setItem('sessionExpiryMs', String(getNextBoundaryMs())); 
      } catch (error) {
        console.warn('Erro ao guardar expiração da sessão:', error);
      }
      
      scheduleExpirySignOut(Number(localStorage.getItem('sessionExpiryMs') || 0));
      
      if (window.notifications) {
        window.notifications.success('Login realizado com sucesso!');
      }
      
      window.location.href = 'dashboard.html';
    } catch (err) {
      const message = traduzErroAuth(err);
      if (errorP) {
        errorP.textContent = message;
        errorP.hidden = false;
      }
      
      if (window.notifications) {
        window.notifications.error(message);
      }
    } finally {
      if (window.loading?.button) {
        window.loading.button(submitBtn, false);
      }
    }
  });
  
  // Login com Google
  const btnGoogle = document.getElementById('btnGoogle');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      const errorP = document.getElementById('loginError');
      if (errorP) errorP.hidden = true;
      
      try {
        if (window.loading?.button) {
          window.loading.button(btnGoogle, true, 'A entrar...');
        }
        
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        
        if (isStandalone) {
          await auth.signInWithRedirect(provider);
        } else {
          try {
            await auth.signInWithPopup(provider);
          } catch (err) {
            if (String(err?.code || '').includes('popup-blocked')) {
              await auth.signInWithRedirect(provider);
            } else {
              throw err;
            }
          }
        }
        
        try { 
          localStorage.setItem('sessionExpiryMs', String(getNextBoundaryMs())); 
        } catch (error) {
          console.warn('Erro ao guardar expiração da sessão:', error);
        }
        
        scheduleExpirySignOut(Number(localStorage.getItem('sessionExpiryMs') || 0));
        
        if (window.notifications) {
          window.notifications.success('Login realizado com sucesso!');
        }
        
        window.location.href = 'dashboard.html';
      } catch (err) {
        const message = traduzErroAuth(err);
        if (errorP) {
          errorP.textContent = message;
          errorP.hidden = false;
        }
        
        if (window.notifications) {
          window.notifications.error(message);
        }
      } finally {
        if (window.loading?.button) {
          window.loading.button(btnGoogle, false);
        }
      }
    });
  }
})();

function traduzErroAuth(err) {
  if (!err) return 'Erro desconhecido';
  
  const code = err?.code || '';
  if (code.includes('user-not-found')) return 'Utilizador não encontrado';
  if (code.includes('wrong-password')) return 'Password incorreta';
  if (code.includes('invalid-email')) return 'Email inválido';
  if (code.includes('operation-not-allowed')) return 'Método de login (Google) não está ativado no Firebase.';
  if (code.includes('unauthorized-domain')) return 'Domínio não autorizado no Firebase Auth. Adiciona o domínio em Authentication > Settings > Authorized domains.';
  if (code.includes('popup-blocked')) return 'O pop-up foi bloqueado pelo navegador. Redirecionei para método alternativo.';
  if (code.includes('popup-closed-by-user')) return 'O pop-up foi fechado antes de concluir o login.';
  if (code.includes('cancelled-popup-request')) return 'Pedido de pop-up cancelado. Tenta novamente.';
  if (code.includes('account-exists-with-different-credential')) return 'A conta já existe com outro método. Entra com o método original e associa o Google.';
  if (code.includes('too-many-requests')) return 'Demasiadas tentativas de login. Tenta novamente mais tarde.';
  if (code.includes('network-request-failed')) return 'Erro de rede. Verifica a tua ligação à internet.';
  
  return 'Não foi possível iniciar sessão';
}

window.protectPage = protectPage;
window.onAuthReady = onAuthReady; 

// --- Expiração diária às 12:00 ou 00:00 ---
let expiryTimerId = null;

function clearExpiryTimer() { 
  if (expiryTimerId) { 
    try { 
      clearTimeout(expiryTimerId); 
    } catch (error) {
      console.warn('Erro ao limpar timer de expiração:', error);
    }
    expiryTimerId = null; 
  } 
}

function getNextBoundaryMs(nowMs) {
  const now = nowMs ? new Date(nowMs) : new Date();
  const h = now.getHours();
  const boundary = new Date(now);
  
  if (h < 12) {
    boundary.setHours(12, 0, 0, 0);
  } else {
    boundary.setDate(boundary.getDate() + 1);
    boundary.setHours(0, 0, 0, 0);
  }
  
  return boundary.getTime();
}

function scheduleExpirySignOut(expiryMs) {
  clearExpiryTimer();
  const now = Date.now();
  const target = Number(expiryMs || 0);
  
  if (!Number.isFinite(target) || target <= now) return;
  
  const delay = Math.min(target - now, 2_147_483_647); // clamp para setTimeout
  
  expiryTimerId = setTimeout(() => {
    try { 
      localStorage.removeItem('sessionExpiryMs'); 
    } catch (error) {
      console.warn('Erro ao remover expiração da sessão:', error);
    }
    
    if (auth) {
      auth.signOut().finally(() => { 
        window.location.href = 'index.html'; 
      });
    } else {
      window.location.href = 'index.html';
    }
  }, delay);
}