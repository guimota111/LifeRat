# LifeRats — app

Expo SDK 57, Expo Router, TypeScript, Supabase, TanStack Query, i18next.

```sh
cp .env.example .env   # EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start
```

## Mapa

- `src/app/` — rotas. `(auth)` login e cadastro; `(app)/(tabs)` Hoje, Hábitos, Clubes, Perfil; `(app)/habit/[id]`, `club/[id]`, `challenge/new`, `challenge/[id]`.
- `src/lib/` — `supabase.ts` (cliente), `types.ts` (tipos do banco), `dates.ts` (datas locais por fuso), `habits.ts` (frequência, metas, status do dia), `i18n.ts`.
- `src/hooks/` — `use-habits.ts` e `use-clubs.ts`: queries e mutations com TanStack Query.
- `src/providers/auth.tsx` — sessão, perfil, sincronização do fuso com o aparelho.
- `src/components/` — `ui.tsx` (Screen, Button, TextField, Chip, Card…) e `habit-row.tsx` (linha do quick log).
- `src/locales/` — `pt-BR.json` e `en.json`; `native/` são as strings do sistema (Info.plist).

## Regras que o app assume

- O dia local é calculado no fuso do perfil, que segue o aparelho.
- Cada toque no quick log insere um registro; desfazer apaga o último registro de hoje.
- Hábito negativo: o dia é limpo até registrar uma recaída.
- Desafio com métrica "hábito": cada participante escolhe qual hábito seu conta ao entrar.
