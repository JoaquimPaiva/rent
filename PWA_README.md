# Rent-a-Car - Progressive Web App (PWA)

## O que é uma PWA?

Uma Progressive Web App (PWA) é uma aplicação web que oferece uma experiência semelhante a uma aplicação nativa, incluindo:

- **Instalação** - Pode ser instalada no dispositivo como uma app
- **Funcionalidade offline** - Funciona mesmo sem ligação à internet
- **Notificações push** - Recebe notificações mesmo quando fechada
- **Sincronização em background** - Sincroniza dados quando possível
- **Interface nativa** - Aparece como uma app independente

## Funcionalidades PWA Implementadas

### 1. Service Worker (`sw.js`)
- **Cache inteligente** de arquivos estáticos e dinâmicos
- **Estratégias de cache** diferentes para diferentes tipos de conteúdo
- **Funcionalidade offline** com fallbacks apropriados
- **Sincronização em background** quando a ligação é restaurada

### 2. Manifest (`manifest.json`)
- **Configuração da app** para instalação
- **Ícones** em múltiplos tamanhos para diferentes dispositivos
- **Shortcuts** para acesso rápido a funcionalidades principais
- **Tema e cores** consistentes com a identidade visual

### 3. PWA Manager (`js/pwa.js`)
- **Gestão de instalação** automática
- **Indicador de status** online/offline
- **Notificações** push e locais
- **Atualizações automáticas** da app
- **Sincronização** de dados offline

### 4. Meta Tags PWA
- **Compatibilidade** com iOS Safari
- **Integração** com Windows
- **SEO** otimizado para motores de busca

## Como Instalar a PWA

### No Chrome/Edge:
1. Abrir a aplicação no navegador
2. Clicar no ícone de instalação na barra de endereços
3. Clicar "Instalar"
4. A app será instalada no desktop/dispositivo

### No Android:
1. Abrir a aplicação no Chrome
2. Clicar no menu (3 pontos)
3. Selecionar "Adicionar à tela inicial"
4. A app será instalada como uma app nativa

### No iOS:
1. Abrir a aplicação no Safari
2. Clicar no botão de partilha
3. Selecionar "Adicionar à tela inicial"
4. A app aparecerá na tela inicial

## Funcionalidades Offline

### O que funciona offline:
- ✅ Navegação entre páginas
- ✅ Formulários (dados guardados localmente)
- ✅ Interface da aplicação
- ✅ Estilos e scripts

### O que requer ligação:
- ❌ Autenticação Firebase
- ❌ Sincronização de dados
- ❌ Envio de formulários
- ❌ Notificações push

## Estratégias de Cache

### Cache Estático (Cache First)
- HTML, CSS, JavaScript
- Imagens e ícones
- Manifest e Service Worker

### Cache Dinâmico (Network First)
- Dados do Firebase
- Conteúdo dinâmico
- Fallback para cache quando offline

### Cache de Recursos Externos
- CDNs do Firebase
- Bibliotecas externas
- Fallback para versões em cache

## Notificações

### Tipos de Notificações:
1. **Instalação** - Confirmação de instalação bem-sucedida
2. **Atualizações** - Nova versão disponível
3. **Status** - Mudanças de conectividade
4. **Push** - Notificações do servidor (futuro)

### Permissões:
- As notificações são solicitadas após interação do utilizador
- Podem ser desativadas nas configurações do navegador
- Funcionam mesmo quando a app está fechada

## Atualizações

### Como funcionam:
1. O Service Worker detecta uma nova versão
2. Mostra um botão de atualização
3. O utilizador clica para atualizar
4. A página é recarregada com a nova versão

### Vantagens:
- **Automáticas** - Não requer intervenção manual
- **Transparentes** - O utilizador pode continuar a trabalhar
- **Seguras** - Só atualiza quando solicitado

## Monitorização e Debug

### Console do Navegador:
- `[PWA]` - Logs relacionados com funcionalidades PWA
- `[SW]` - Logs do Service Worker
- `[Firebase]` - Logs de autenticação e dados

### Ferramentas de Desenvolvimento:
- **Application Tab** - Ver cache e Service Workers
- **Network Tab** - Monitorizar estratégias de cache
- **Lighthouse** - Auditar funcionalidades PWA

## Configuração do Servidor

### Headers necessários:
```http
Service-Worker-Allowed: /
Cache-Control: public, max-age=31536000
```

### HTTPS obrigatório:
- PWAs só funcionam em HTTPS
- Service Workers requerem contexto seguro
- Manifest e cache funcionam melhor com HTTPS

## Troubleshooting

### Problemas comuns:

#### App não instala:
- Verificar se o manifest está acessível
- Confirmar que o Service Worker está registado
- Verificar se todos os ícones estão disponíveis

#### Cache não funciona:
- Verificar se o Service Worker está ativo
- Limpar cache do navegador
- Verificar se os arquivos estão na lista de cache

#### Notificações não aparecem:
- Verificar permissões no navegador
- Confirmar que o Service Worker está ativo
- Verificar se as notificações estão habilitadas

## Próximos Passos

### Funcionalidades futuras:
- [ ] Sincronização offline mais robusta
- [ ] Notificações push do servidor
- [ ] Gestão avançada de cache
- [ ] Métricas de performance PWA
- [ ] Integração com app stores

### Otimizações:
- [ ] Lazy loading de componentes
- [ ] Compressão de assets
- [ ] Cache inteligente baseado em uso
- [ ] Background sync mais eficiente

## Suporte

Para questões relacionadas com a PWA:
1. Verificar o console do navegador para erros
2. Confirmar que todos os arquivos estão acessíveis
3. Testar em diferentes navegadores e dispositivos
4. Verificar se o servidor suporta HTTPS

---

**Nota**: Esta PWA foi desenvolvida seguindo as melhores práticas e padrões web modernos, garantindo compatibilidade com a maioria dos navegadores e dispositivos.
