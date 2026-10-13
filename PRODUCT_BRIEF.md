# LifeRats — definição de produto

Status: decisões fechadas em 2026-10-13; nenhuma linha de código ainda.
Nome de trabalho: LifeRats (repo GitHub `LifeRat`, a ser renomeado).
Referências de produto, somente ideias: `novo-life-hub` (Tamagochi Me), `BookRat`, `clubedolivro` (Patoteca).
Nenhum código, banco, credencial ou usuário desses projetos é reaproveitado. Os repositórios deles não são alterados.

## 1. O que é

App nativo (iOS e Android) de hábitos com competição entre amigos.

- **Sozinho:** hábitos customizados com preenchimento em um toque, sincronizados com relógio, apps de passos, exercícios e Strava.
- **Com amigos:** clubes, feed de atividade e desafios com regra definida pelo criador: quem anda mais, quem corre mais rápido acima de 5 km, quem assiste mais filmes no mês, quem termina a lista do Oscar primeiro.
- **Catálogos:** livros, filmes, séries, jogos e podcasts entram como itens reais, não como texto livre.

Sem mascote. Sem aparelhos físicos. pt-BR e inglês desde o lançamento.

## 2. Decisões confirmadas com o dono do produto

| Tema | Decisão |
| --- | --- |
| Plataforma | Nativo nas lojas. Grande público não pode depender de Health Auto Export. |
| Integrações | Escolha técnica delegada (ver §4). |
| Catálogos | TMDB (filmes e séries), Google Books, jogos e podcasts. |
| Monetização | Caminho delegado; priorizar o mais aplicável e rentável (ver §6). |
| Tipos de hábito | Sim/não, contador com meta, duração, quantidade com unidade, baseado em catálogo, vindo de integração. |
| Frequência | Diário, X vezes por semana, dias específicos, a cada N dias. Hábitos negativos (não fazer). |
| Metas | Do usuário e do clube. |
| Desafios | Métrica + filtro + agregação + período + critério de vitória. Listas curadas pelo criador do clube. Foto de evidência opcional, decidida na criação. Times, apostas e handicap. |
| Privacidade | Visibilidade por hábito: privado, amigos, público. |
| Social | Feed de atividade com reações. Clubes públicos descobríveis e convite por link. |
| Lançamento | Primeira fatia: hábitos solo + quick log + integrações de saúde + um tipo de desafio. |

## 3. Stack

| Camada | Escolha | Motivo |
| --- | --- | --- |
| App | React Native + Expo (dev client, EAS Build) + TypeScript | Mesma linguagem dos projetos anteriores; um código para as duas lojas; HealthKit e Health Connect exigem módulo nativo, o que o dev client permite. |
| Backend | Supabase: Postgres, Auth, Storage, Realtime, Edge Functions | Rankings, filtros ("corridas > 5 km") e agregações são SQL. Row Level Security implementa a visibilidade por hábito no banco, não no cliente. Firestore dificulta exatamente essas consultas. |
| Pagamento | RevenueCat sobre App Store e Google Play | Assinatura nas lojas é obrigatória para conteúdo digital; RevenueCat unifica recibos e trial. |
| Push | Expo Notifications (APNs/FCM) | Sem Twilio/WhatsApp no lançamento. |
| i18n | i18next + expo-localization | pt-BR e en desde o dia 1; nenhum texto hardcoded. |
| Fuso | Fuso do usuário no perfil; eventos em UTC, com `local_date` gravada | Corrige a limitação do BookRat (fuso fixo). |
| Análise | PostHog | Funil de onboarding e conversão do trial. |

## 4. Integrações no lançamento

| Fonte | Cobertura | Como |
| --- | --- | --- |
| Apple Health (HealthKit) | passos, distância, treinos, sono, frequência cardíaca; Apple Watch chega por aqui | leitura em segundo plano, módulo nativo iOS |
| Health Connect | equivalente no Android; Samsung Health, Google Fit, Mi Fitness escrevem nele | módulo nativo Android |
| Strava | corridas, pedaladas com ritmo e velocidade média; cobre Garmin, Polar, Coros, Zwift via sincronização deles com Strava | OAuth + webhook para uma Edge Function |

Adiados: Garmin direto (API exige aprovação comercial), Fitbit, Oura, Whoop.

Catálogos: TMDB (filmes + séries por temporada/episódio), Google Books, IGDB (jogos, via API da Twitch), Podcast Index ou iTunes Search (podcasts). Itens ficam em cache na nossa tabela `catalog_items` com id externo; o usuário nunca cria item livre quando o catálogo cobre.

Regra de confiança: todo registro carrega `source`. Registro vindo de integração é **verificado**; manual é **declarado**. O criador do desafio escolhe se aceita só verificados.

## 5. Modelo de domínio

Tabelas principais (Postgres, nomes em inglês no código):

**Identidade e social**
- `profiles`: id, handle, nome, avatar, fuso, idioma, visibilidade do perfil, plano.
- `friendships`: par de usuários, estado (pendente, aceita, bloqueada). Amizade é mútua; não há "seguir".

**Hábitos**
- `habits`: dono, nome, ícone, tipo (`bool`, `counter`, `duration`, `quantity`, `catalog`, `integration`), unidade, meta (valor + janela: dia/semana/mês), regra de frequência (`daily`, `times_per_week:n`, `weekdays:[...]`, `every_n_days:n`), `negative` (hábito de não fazer), `visibility` (`private`, `friends`, `public`), categoria de catálogo quando `catalog`, métrica de integração quando `integration`, arquivado em.
- `habit_entries`: hábito, timestamp UTC, `local_date`, valor, `source` (`manual`, `healthkit`, `health_connect`, `strava`, `shortcut`), `external_id` (idempotência), item de catálogo, progresso no item (página, episódio, %), nota, foto.
- `activities`: treinos importados: tipo, início, duração, distância, velocidade média, ritmo, FC média, fonte, id externo. São a matéria-prima de desafios como "velocidade média em corridas > 5 km".
- `daily_metrics`: por usuário, dia e fonte: passos, distância, minutos ativos, sono. Conflito entre fontes resolvido por prioridade configurável (relógio > telefone).

**Catálogo**
- `catalog_items`: tipo (`book`, `movie`, `tv`, `game`, `podcast`), provedor, id externo, título, capa, metadados (páginas, duração, temporadas), cache.
- `user_items`: status do usuário com o item (quero, em andamento, concluído, abandonado), nota, concluído em.
- `lists` e `list_items`: listas curadas pelo criador do clube (ex.: indicados ao Oscar 2026), usadas por desafios de lista.

**Clubes e desafios**
- `clubs`: nome, descrição, capa, `public` (descobrível) ou convite, dono, código de convite.
- `club_members`: papel (dono, admin, membro), entrou em.
- `club_goals`: meta coletiva do clube (ex.: 1.000.000 passos somados no mês).
- `challenges`: clube, nome, período, `spec` (JSON validado), `proof` (`none`, `photo_optional`, `photo_required`), `sources_allowed` (`any`, `verified_only`), `teams` (bool), `bet` (texto livre do que o perdedor deve), estado (rascunho, ativo, encerrado), vencedor apurado.
- `challenge_participants`: usuário, time, handicap (multiplicador ou bônus fixo), entrou em.
- `challenge_scores`: materialização diária por participante e por time, recalculada por função no banco.

Spec de desafio (JSON):

```json
{
  "metric":    "steps | distance_km | activity.avg_speed | habit:<id> | catalog:movie.completed | list:<id>.completed",
  "filter":    { "activity.type": "run", "activity.distance_km": { "gte": 5 } },
  "aggregate": "sum | max | avg | count | streak | first_to_complete",
  "window":    { "start": "2026-11-01", "end": "2026-11-30" },
  "win":       "highest | lowest | first_to_target",
  "target":    100000,
  "tiebreak":  "first_to_reach"
}
```

Cobre os exemplos: mais passos no período (`steps`, `sum`, `highest`); maior velocidade média em corridas > 5 km (`activity.avg_speed`, filtro, `max` ou `avg`); mais filmes no mês (`catalog:movie.completed`, `count`); todos os filmes do Oscar antes (`list:<id>.completed`, `first_to_complete`).

**Feed**
- `feed_events`: autor, tipo (registro, item concluído, recorde, entrou no desafio, venceu), payload, visibilidade herdada do hábito.
- `reactions` e `comments`.

**Privacidade:** a visibilidade do hábito é a fonte da verdade. Entrar em um desafio concede aos membros do clube leitura da métrica daquele desafio durante o período, e só dela. Participar de desafio nunca torna o hábito público.

## 6. Monetização

Modelo: **freemium com assinatura**, e o criador do clube é quem paga pelos recursos do clube. Membros usam de graça o que o criador desbloqueou. Isso faz o pagante trazer usuários.

| | Grátis | Pro |
| --- | --- | --- |
| Hábitos | até 6 | ilimitados |
| Apple Health / Health Connect | sim | sim |
| Strava | não | sim |
| Catálogos | sim | sim |
| Entrar em clubes e desafios | ilimitado | ilimitado |
| Criar clube | 1, até 10 membros | ilimitados |
| Tipos de desafio | soma simples no período | filtros, listas, times, handicap, aposta, só verificados |
| Histórico e estatísticas | 90 dias | completo, exportação |

Preço de partida: R$ 14,90/mês ou R$ 99/ano; US$ 4,99/mês ou US$ 29,99/ano. Trial de 7 dias. Sem anúncios. Empresas e academias ficam para depois, com plano por assento.

Apostas: o app registra o que foi apostado em **texto** (ex.: "perdedor paga o churrasco") e quem perdeu. O app **não** movimenta dinheiro. Isso evita regulação de apostas e as regras das lojas sobre jogos de azar.

## 7. Regras de pontuação

- Só conta o que acontece dentro do período do desafio, no fuso de cada participante.
- Mesmo registro nunca pontua duas vezes: `external_id` garante idempotência nas integrações; progresso em item de catálogo é global por usuário, como no BookRat.
- Edição ou exclusão de registro recalcula a pontuação.
- Handicap é aplicado na pontuação exibida, com a pontuação bruta sempre visível.
- Times: soma ou média por time, definido na criação.
- Empate: quem atingiu a pontuação primeiro.
- Hábito negativo pontua por dia sem registro de recaída; a recaída é registrada pelo próprio usuário.

## 8. Fases

**Fase 1 — lançamento (TestFlight e teste interno antes das lojas)**
1. Conta, perfil, fuso, idioma.
2. Hábitos de todos os tipos exceto `catalog`; regras de frequência; negativos; visibilidade.
3. Quick log: tela inicial com o dia inteiro preenchível em um toque por hábito; widget iOS/Android.
4. HealthKit e Health Connect: passos, distância, treinos.
5. Amizades, clube com convite por link, feed com reações.
6. Um tipo de desafio: `sum` de uma métrica no período, `highest` vence, foto opcional.
7. Pro via RevenueCat com os limites de §6.

**Fase 2**
- Catálogos (TMDB, Google Books, IGDB, podcasts) e hábitos de catálogo.
- Strava.
- Spec completa: filtros, `max/avg/count`, listas, `first_to_complete`.
- Clubes públicos e busca.

**Fase 3**
- Times, handicap, apostas, metas de clube.
- Estatísticas avançadas e exportação.
- Plano para empresas e academias.

## 9. Decisões pendentes

- Nome definitivo e identidade visual (sem mascote; "Rats" segue a linha GymRats/BookRat).
- Se o Pro também destrava algo para quem só participa, ou se o valor para membro fica 100% no criador.
- Política de moderação de clubes públicos e fotos (denúncia, bloqueio) antes de abrir a descoberta.
- Prioridade entre fontes quando relógio e telefone reportam passos do mesmo dia.
