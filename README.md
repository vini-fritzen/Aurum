# Aurum | Metals Market Analysis

Dashboard escuro/luxo para acompanhar metais (ouro, prata, platina, paládio, cobre) com histórico e gráficos.

## Sem banco • sem localStorage • sem chaves
- **GitHub Actions** coleta dados e salva em `public/data/*.json`
- O site (GitHub Pages) apenas lê os JSONs

## Rodar local
```bash
npm i
npm run fetch:data
npm run dev
```

## Deploy no GitHub Pages
1. Crie repo e faça push
2. Settings → Pages → Source: GitHub Actions
3. Edite `.github/workflows/deploy.yml` e troque `NEXT_PUBLIC_BASE_PATH` para `/<NOME_DO_REPO>`
4. Push na branch `main`

## Atualização automática
Workflow `Fetch metal data` roda a cada 5 min e commita `public/data` se mudar.

## APIs usadas
- Metais: `https://api.gold-api.com/price/{symbol}` (XAU/XAG/XPT/XPD e HG para cobre)
- Câmbio: `https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL`
