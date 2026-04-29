# AURUM — Precious Metals Intelligence

AURUM é um dashboard de análise de **metais preciosos** focado em **ouro e prata**, com preços em **USD e BRL**, histórico visual, gráficos interativos e o indicador **Gold/Silver Ratio**.

O projeto foi pensado como uma ferramenta de **análise de mercado**, não de trading especulativo, priorizando clareza, elegância visual e arquitetura simples.

🔗 **Acesse o projeto:**  
https://vini-fritzen.github.io/Aurum/

---

## ✨ Funcionalidades

- 📊 **Dashboard de Metais**
  - Ouro (XAU)
  - Prata (XAG)
  - Platina (XPT)
  - Paládio (XPD)
  - Cobre (XCU)
- 💱 Preços em **USD e BRL**
- ⚖️ Valores por **onça (oz)** e **grama (g)**
- 📈 Gráficos históricos interativos
  - 30m, 1h, 3h, 6h, 12h, 24h
  - 7d, 30d, 90d
- ⚡ Atualização em tempo real no cliente (~3s)
- 🛟 Fallback automático para JSON estático (~5 min via GitHub Actions)
- 🧮 **Gold / Silver Ratio**
  - Valor atual
  - Histórico
  - Interpretação de mercado

---

## 🧠 Gold / Silver Ratio — O que é?

O **Gold/Silver Ratio** representa quantas onças de prata são necessárias para comprar **1 onça de ouro**.

- 📈 **Ratio alto** → Ouro caro ou prata barata  
- 📉 **Ratio baixo** → Ouro barato ou prata cara  

🔗 Página dedicada:  
https://vini-fritzen.github.io/Aurum/ratio/

---

## 🏗️ Arquitetura

- Sem banco de dados
- Sem localStorage
- Sem autenticação
- Sem chaves no frontend

### Fluxo:
1. Frontend consulta APIs de metais + câmbio em tempo real (~3s)
2. Se houver falha externa, o app usa JSON estático em `public/data`
3. GitHub Actions continua atualizando o fallback (~5 min)


## ☁️ Deploy (Vercel e GitHub Pages)

- **Vercel (recomendado para tempo real):** não defina `NEXT_PUBLIC_STATIC_EXPORT`. Assim, a rota ` /api/live/latest ` roda no servidor e evita bloqueios de CORS/rate limit no navegador.
- **GitHub Pages (estático):** defina `NEXT_PUBLIC_STATIC_EXPORT=1` e `NEXT_PUBLIC_BASE_PATH=/Aurum`.



### Troubleshooting (Vercel)

Se no Vercel "não está vindo" cotação ao vivo, verifique:
- **NÃO** definir `NEXT_PUBLIC_STATIC_EXPORT=1` no projeto Vercel
- **NÃO** definir `NEXT_PUBLIC_BASE_PATH=/Aurum` no projeto Vercel
- A rota `https://SEU_DOMINIO/api/live/latest` deve responder JSON

---

## 🛠️ Stack Técnica

- Next.js 15 (App Router)
- TypeScript
- Recharts
- GitHub Pages
- GitHub Actions
- Static Export

---

## 🚀 Rodar localmente

```bash
npm install
npm run dev
```

---

## 📂 Estrutura de dados

```txt
public/data/
  XAU.json
  XAG.json
  XPT.json
  XPD.json
  XCU.json
  latest.json
```

---

## 👤 Autor

Vinícius Fritzen

---

## 📜 Licença

MIT
