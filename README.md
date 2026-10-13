# LifeRats

App nativo (iOS e Android) de hábitos com competição entre amigos: preenchimento em um toque, sincronização com relógio, apps de saúde e Strava, catálogos de livros, filmes, séries, jogos e podcasts, e desafios em clubes com regras definidas pelo criador.

Decisões de produto, stack e modelo de dados: [PRODUCT_BRIEF.md](PRODUCT_BRIEF.md).

Projeto independente de `novo-life-hub`, `BookRat` e `clubedolivro`.

## Estrutura

| Pasta | O que é |
| --- | --- |
| `mobile/` | App Expo (React Native + TypeScript, Expo Router) |
| `supabase/` | Projeto Supabase gerenciado pela CLI: `config.toml` e `migrations/` |

## Backend (Supabase)

Pré-requisito: um projeto criado em [supabase.com](https://supabase.com). A CLI roda via `npx`, não precisa instalar.

```sh
npx supabase login                      # abre o navegador e guarda o token
npx supabase link --project-ref <ref>   # ref aparece na URL do painel
npx supabase db push                    # aplica supabase/migrations/ no projeto
```

Depois de linkar, gerar os tipos TypeScript do banco para o app:

```sh
cd mobile && npm run gen:types
```

Rodar o banco localmente (`npx supabase start`) exige Docker.

No painel, em **Authentication → Providers → Email**, deixe "Confirm email" ligado ou desligado conforme preferir; o app trata os dois casos.

## App (Expo)

```sh
cd mobile
cp .env.example .env          # URL e anon key: painel → Settings → API
npm install
npx expo start                # QR code para o Expo Go
```

Checagens antes de commitar:

```sh
npm run typecheck
npm run lint
npx expo-doctor
```

Integrações nativas (HealthKit, Health Connect) vão exigir um development build (`eas build --profile development`); até lá o Expo Go basta.
