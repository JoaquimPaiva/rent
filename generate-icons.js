#!/usr/bin/env node

/**
 * Script para gerar ícones PWA automaticamente
 * Requer: Node.js e npm install sharp
 * 
 * Uso: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Configuração dos ícones
const ICON_SIZES = [
  { size: 16, name: 'Icon-16x16.png' },
  { size: 32, name: 'Icon-32x32.png' },
  { size: 72, name: 'Icon-72x72.png' },
  { size: 96, name: 'Icon-96x96.png' },
  { size: 128, name: 'Icon-128x128.png' },
  { size: 144, name: 'Icon-144x144.png' },
  { size: 152, name: 'Icon-152x152.png' },
  { size: 180, name: 'Icon-180x180.png' },
  { size: 192, name: 'Icon-192x192.png' },
  { size: 384, name: 'Icon-384x384.png' },
  { size: 512, name: 'Icon-512x512.png' }
];

// Cores para o ícone
const ICON_COLORS = {
  primary: '#3b82f6',
  secondary: '#1e40af',
  accent: '#60a5fa'
};

// Função para gerar SVG do ícone
function generateIconSVG(size) {
  const center = size / 2;
  const carWidth = size * 0.6;
  const carHeight = size * 0.4;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${ICON_COLORS.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${ICON_COLORS.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${center}" cy="${center}" r="${size * 0.45}" fill="url(#bg)" />
  
  <!-- Car body -->
  <rect x="${center - carWidth/2}" y="${center - carHeight/3}" 
        width="${carWidth}" height="${carHeight}" 
        rx="${carHeight/4}" fill="white" />
  
  <!-- Car windows -->
  <rect x="${center - carWidth/3}" y="${center - carHeight/2.5}" 
        width="${carWidth/1.5}" height="${carHeight/3}" 
        rx="${carHeight/8}" fill="${ICON_COLORS.accent}" />
  
  <!-- Wheels -->
  <circle cx="${center - carWidth/3}" cy="${center + carHeight/4}" 
          r="${carHeight/6}" fill="#374151" />
  <circle cx="${center + carWidth/3}" cy="${center + carHeight/4}" 
          r="${carHeight/6}" fill="#374151" />
  
  <!-- Car details -->
  <rect x="${center - carWidth/2.5}" y="${center - carHeight/4}" 
        width="${carWidth/8}" height="${carHeight/8}" fill="white" />
  <rect x="${center + carWidth/2.5 - carWidth/8}" y="${center - carHeight/4}" 
        width="${carWidth/8}" height="${carHeight/8}" fill="white" />
</svg>`;
}

// Função para gerar ícones
async function generateIcons() {
  try {
    // Verificar se a pasta img existe
    const imgDir = path.join(__dirname, 'img');
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }
    
    // Verificar se o Sharp está instalado
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.warn('Sharp não está instalado. Execute: npm install sharp');
      return;
    }
    
    console.log('Gerando ícones PWA...');
    
    // Gerar cada ícone
    for (const icon of ICON_SIZES) {
      try {
        const svgContent = generateIconSVG(icon.size);
        const svgPath = path.join(imgDir, `temp-${icon.name.replace('.png', '.svg')}`);
        const pngPath = path.join(imgDir, icon.name);
        
        // Guardar SVG temporário
        fs.writeFileSync(svgPath, svgContent);
        
        // Converter para PNG
        await sharp(svgPath)
          .resize(icon.size, icon.size)
          .png()
          .toFile(pngPath);
        
        // Remover SVG temporário
        fs.unlinkSync(svgPath);
        
        console.log(`✅ ${icon.name} gerado`);
      } catch (error) {
        console.error(`❌ Erro ao gerar ${icon.name}:`, error.message);
      }
    }
    
    // Gerar favicon.ico (16x16)
    try {
      const faviconPath = path.join(imgDir, 'favicon.ico');
      const svgContent = generateIconSVG(16);
      const svgPath = path.join(imgDir, 'temp-favicon.svg');
      
      fs.writeFileSync(svgPath, svgContent);
      
      await sharp(svgPath)
        .resize(16, 16)
        .png()
        .toFile(faviconPath);
      
      fs.unlinkSync(svgPath);
      console.log('✅ favicon.ico gerado');
    } catch (error) {
      console.error('❌ Erro ao gerar favicon.ico:', error.message);
    }
    
    // Gerar ícone para Safari pinned tab
    try {
      const safariIconPath = path.join(imgDir, 'safari-pinned-tab.svg');
      const svgContent = generateIconSVG(16);
      fs.writeFileSync(safariIconPath, svgContent);
      console.log('✅ safari-pinned-tab.svg gerado');
    } catch (error) {
      console.error('❌ Erro ao gerar safari-pinned-tab.svg:', error.message);
    }
    
    console.log('🎉 Todos os ícones foram gerados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral ao gerar ícones:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateIcons().catch((error) => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });
}

module.exports = { generateIcons, generateIconSVG };
