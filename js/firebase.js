// Preenche com as credenciais do teu projeto Firebase
// Console Firebase -> Configurações do projeto -> SDK Web
const firebaseConfig = {
  apiKey: "AIzaSyDziuC_KtfBrZV1MDPJkqV5hQdE9VKeb88",
  authDomain: "rent-3c304.firebaseapp.com",
  databaseURL: "https://rent-3c304-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rent-3c304",
  storageBucket: "rent-3c304.appspot.com",
  messagingSenderId: "333350818338",
  appId: "1:333350818338:web:2c55ae54788f28a2e0b07b",
  measurementId: "G-V0NBBY03P3"
};

// Verificar se o Firebase está disponível
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK não está carregado. Verifica se o script do Firebase foi incluído na página.');
  // Criar objetos vazios para evitar erros
  window.auth = null;
  window.db = null;

} else {
  // Inicialização
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
      // console.log('Firebase inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar Firebase:', error);
    }
  }

  // Export simples no escopo global
  let auth, db;

  try {
    auth = firebase.auth();
    db = firebase.database();
    
    // Verificar se os serviços foram inicializados corretamente
    if (!auth) console.warn('Firebase Auth não foi inicializado');
    if (!db) console.warn('Firebase Database não foi inicializado');
    
  } catch (error) {
    console.error('Erro ao inicializar serviços Firebase:', error);
    // Definir valores padrão em caso de erro
    auth = null;
    db = null;
  }

  // Expor globalmente com verificações
  window.auth = auth;
  window.db = db;
  
  // Adicionar listeners para mudanças de estado de autenticação
  if (auth) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        // console.log('Utilizador autenticado:', user.email);
      } else {
        console.log('Utilizador não autenticado');
      }
    });
  }
}