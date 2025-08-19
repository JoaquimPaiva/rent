# 🚀 Instalação Rápida da PWA Rent-a-Car

## 📋 Pré-requisitos

- Node.js 16+ instalado
- Navegador moderno (Chrome, Edge, Firefox, Safari)
- Servidor web com HTTPS (para produção)

## 🛠️ Instalação Local

### 1. Instalar dependências
```bash
npm install
```

### 2. Gerar ícones PWA
```bash
npm run generate-icons
```

### 3. Iniciar servidor local
```bash
npm start
```

### 4. Abrir no navegador
```
http://localhost:8080
```

## 📱 Como Instalar como App

### Chrome/Edge (Desktop)
1. Abrir a aplicação no navegador
2. Clicar no ícone de instalação na barra de endereços
3. Clicar "Instalar"
4. A app será instalada no desktop

### Android
1. Abrir no Chrome
2. Menu (3 pontos) → "Adicionar à tela inicial"
3. A app aparecerá como uma app nativa

### iOS
1. Abrir no Safari
2. Botão de partilha → "Adicionar à tela inicial"
3. A app aparecerá na tela inicial

## 🔧 Configuração do Servidor

### Apache (.htaccess)
- O arquivo `.htaccess` já está configurado
- Colocar na raiz do servidor web

### Nginx
```nginx
location / {
    try_files $uri $uri/ /index.html;
    
    # Headers PWA
    add_header Service-Worker-Allowed "/";
    add_header Cache-Control "public, max-age=31536000" always;
}

# Service Worker
location = /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Service-Worker-Allowed "/";
}
```

### Node.js/Express
```javascript
app.use(express.static('public', {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    if (path.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
    }
  }
}));
```

## 🧪 Testar PWA

### Lighthouse Audit
```bash
npm run test-pwa
```

### Verificar no DevTools
1. Abrir DevTools (F12)
2. Ir para tab "Application"
3. Verificar:
   - Manifest
   - Service Workers
   - Cache Storage

## 📊 Funcionalidades PWA

✅ **Instalação** - Pode ser instalada como app  
✅ **Offline** - Funciona sem internet  
✅ **Cache** - Arquivos guardados localmente  
✅ **Notificações** - Push e locais  
✅ **Atualizações** - Automáticas  
✅ **Sincronização** - Em background  

## 🚨 Troubleshooting

### App não instala
- Verificar se o manifest está acessível
- Confirmar que o Service Worker está registado
- Verificar se todos os ícones estão disponíveis

### Cache não funciona
- Verificar se o Service Worker está ativo
- Limpar cache do navegador
- Verificar se os arquivos estão na lista de cache

### Notificações não aparecem
- Verificar permissões no navegador
- Confirmar que o Service Worker está ativo
- Verificar se as notificações estão habilitadas

## 🌐 Deploy em Produção

### 1. Gerar ícones
```bash
npm run generate-icons
```

### 2. Upload para servidor
- Todos os arquivos para a raiz do servidor
- Incluir `.htaccess` (Apache) ou configuração equivalente

### 3. Verificar HTTPS
- PWA só funciona com HTTPS
- Configurar certificado SSL

### 4. Testar instalação
- Abrir em diferentes dispositivos
- Testar funcionalidade offline
- Verificar notificações

## 📞 Suporte

Para questões técnicas:
1. Verificar console do navegador
2. Consultar `PWA_README.md`
3. Verificar logs do Service Worker
4. Testar em diferentes navegadores

---

**🎉 Parabéns! A sua aplicação Rent-a-Car é agora uma PWA completa!**
