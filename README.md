# OptCar - Sistema de Gestão de Aluguer de Veículos

Um sistema completo de gestão de aluguer de veículos desenvolvido como Progressive Web App (PWA) com interface moderna e funcionalidades avançadas.

## 🚀 Funcionalidades Principais

### 📊 Dashboard Melhorado
- **Estatísticas em tempo real**: Total de veículos, em uso, disponíveis e receita mensal
- **Gráfico de ocupação**: Visualização da taxa de ocupação da frota
- **Alugueres recentes**: Lista dos últimos contratos com status
- **Ações rápidas**: Acesso direto às principais funcionalidades

### 🔍 Sistema de Filtros Avançados
- **Filtros múltiplos**: Por marca, combustível, estado, ano e quilometragem
- **Pesquisa inteligente**: Busca por matrícula, marca, modelo
- **Indicadores visuais**: Mostra resultados filtrados e filtros ativos
- **Interface responsiva**: Adaptado para desktop e mobile

### 🎨 Interface Moderna
- **Design responsivo**: Funciona perfeitamente em todos os dispositivos
- **Tema escuro/claro**: Alternância automática baseada na preferência do sistema
- **Animações suaves**: Transições e efeitos visuais modernos
- **Indicador de progresso**: Wizard visual para criação de alugueres

### 🔔 Sistema de Notificações Avançado
- **Notificações toast**: Feedback visual para ações do usuário
- **Sons e vibração**: Feedback sensorial para diferentes tipos de notificação
- **Notificações push**: Suporte para notificações do sistema
- **Barras de progresso**: Indicadores visuais de duração

### ⌨️ Atalhos de Teclado
- **Navegação rápida**: Alt+1-5 para navegar entre páginas
- **Ações rápidas**: Ctrl+N (novo aluguer), Ctrl+S (submeter), Ctrl+F (pesquisar)
- **Acessibilidade**: F1 para ver todos os atalhos disponíveis
- **Produtividade**: Escape para fechar modais

### 📱 PWA Completo
- **Instalação**: Pode ser instalado como app nativo
- **Modo offline**: Funciona sem conexão com internet
- **Sincronização**: Dados sincronizados automaticamente
- **Atualizações**: Sistema de atualização automática

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Firebase Realtime Database
- **Autenticação**: Firebase Auth (Email/Password + Google)
- **PWA**: Service Workers, Web App Manifest
- **PDF**: jsPDF para geração de contratos
- **Assinaturas**: Signature Pad para captura digital

## 🚀 Instalação e Configuração

### Pré-requisitos
- Conta Firebase
- Servidor web (local ou remoto)

### Configuração Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication com Email/Password e Google
3. Crie um Realtime Database
4. Configure as regras de segurança
5. Adicione as credenciais no arquivo `js/firebase.js`

### Instalação Local
```bash
# Clone o repositório
git clone [url-do-repositorio]

# Navegue para o diretório
cd optcar

# Abra em um servidor web local
python -m http.server 8000
# ou
npx serve .
```

### Deploy
O projeto pode ser deployado em qualquer servidor web estático:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

## 📋 Estrutura do Projeto

```
optcar/
├── css/
│   └── styles.css          # Estilos principais
├── js/
│   ├── auth.js            # Autenticação
│   ├── dashboard.js       # Dashboard
│   ├── firebase.js        # Configuração Firebase
│   ├── forms.js           # Utilitários de formulários
│   ├── loading.js         # Sistema de loading
│   ├── notifications.js   # Sistema de notificações
│   ├── novoAluguer.js     # Lógica do wizard
│   ├── pwa.js            # Funcionalidades PWA
│   ├── theme.js          # Gestão de temas
│   ├── utils.js          # Utilitários gerais
│   └── veiculos.js       # Gestão de veículos
├── img/                  # Imagens e ícones
├── index.html           # Página de login
├── dashboard.html       # Dashboard principal
├── novo-aluguer.html    # Criação de alugueres
├── veiculos.html        # Gestão de veículos
├── historico.html       # Alugueres em vigor
├── terminados.html      # Alugueres terminados
├── manifest.json        # Configuração PWA
└── sw.js               # Service Worker
```

## 🎯 Funcionalidades Detalhadas

### Gestão de Veículos
- ✅ Adicionar/editar veículos
- ✅ Upload de fotografias
- ✅ Estado detalhado (pneus, pintura, vidros, etc.)
- ✅ Filtros avançados
- ✅ Pesquisa inteligente

### Criação de Alugueres
- ✅ Wizard em 5 passos
- ✅ Validação em tempo real
- ✅ Captura de assinaturas
- ✅ Geração automática de PDF
- ✅ Seleção de veículos disponíveis

### Dashboard e Relatórios
- ✅ Estatísticas em tempo real
- ✅ Gráficos de ocupação
- ✅ Receita mensal
- ✅ Alugueres recentes
- ✅ Indicadores visuais

### Sistema de Notificações
- ✅ Notificações toast
- ✅ Sons e vibração
- ✅ Notificações push
- ✅ Diferentes tipos (sucesso, erro, aviso, info)

### Acessibilidade
- ✅ Navegação por teclado
- ✅ Atalhos de teclado
- ✅ Suporte a screen readers
- ✅ Contraste adequado
- ✅ Redução de movimento

## 🔧 Configurações Avançadas

### Personalização de Temas
```css
:root {
  --primary: #28a745;      /* Cor primária */
  --success: #28a745;      /* Cor de sucesso */
  --warning: #ffc107;      /* Cor de aviso */
  --error: #dc3545;        /* Cor de erro */
}
```

### Configuração de Notificações
```javascript
window.notifications.config({
  duration: 4000,          // Duração das notificações
  maxVisible: 3,           // Máximo de notificações visíveis
  enableSound: true,       // Ativar sons
  enableVibration: true    // Ativar vibração
});
```

## 📱 Compatibilidade

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers

## 🔒 Segurança

- Autenticação Firebase
- Regras de segurança configuráveis
- Validação client-side e server-side
- Proteção contra XSS
- HTTPS obrigatório para PWA

## 🚀 Roadmap

- [ ] Relatórios avançados
- [ ] Integração com sistemas de pagamento
- [ ] App mobile nativo
- [ ] API REST
- [ ] Backup automático
- [ ] Múltiplos idiomas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação
- Entre em contacto através do email

---

**OptCar** - Simplificando a gestão de aluguer de veículos 🚗✨ 