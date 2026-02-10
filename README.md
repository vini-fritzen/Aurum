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
- 🔄 Atualização automática (~5 min)
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
1. GitHub Actions coleta dados (~5 min)
2. Dados são salvos em JSON
3. Site consome JSONs estaticamente

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
