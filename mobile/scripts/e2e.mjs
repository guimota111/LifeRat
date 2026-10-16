// Teste ponta a ponta contra o projeto LifeRats (usa chaves passadas por env).
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';

// Chaves vêm da CLI (já autenticada no keyring), nunca da linha de comando.
const REF = 'lpnwkslgvzlgseovouku';
const URL = `https://${REF}.supabase.co`;
const raw = execSync(`npx --yes supabase projects api-keys --project-ref ${REF} --output-format json`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const keys = JSON.parse(raw.slice(raw.indexOf('{'))).keys;
const ANON = keys.find((k) => k.type === 'publishable')?.api_key;
const SERVICE = keys.find((k) => k.id === 'service_role')?.api_key;
if (!URL || !ANON || !SERVICE) throw new Error('não consegui obter chaves pela CLI');

const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const rand = Math.random().toString(36).slice(2, 8);
const created = [];
let failures = 0;

function check(label, cond, extra = '') {
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
}

async function newUser(name) {
  const c = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `liferats-e2e-${rand}-${name}@example.com`;
  const { data, error } = await c.auth.signUp({
    email,
    password: 'Senha-forte-123',
    options: { data: { display_name: `Teste ${name}`, locale: 'pt-BR', timezone: 'America/Fortaleza' } },
  });
  if (error) throw error;
  check(`signUp ${name} devolve sessão (autoconfirm)`, !!data.session);
  created.push(data.user.id);
  return { c, uid: data.user.id };
}

try {
  const A = await newUser('a');
  const B = await newUser('b');

  // perfil criado pelo trigger
  const { data: pa, error: pe } = await A.c.from('profiles').select('*').eq('id', A.uid).single();
  check('trigger criou profile de A', !pe && pa?.display_name === 'Teste a' && pa.timezone === 'America/Fortaleza', pe?.message);

  // hábito + registro
  const { data: ha, error: he } = await A.c
    .from('habits')
    .insert({ owner_id: A.uid, name: 'Leitura', kind: 'duration', unit: 'min', goal_value: 30, step_value: 10 })
    .select('*')
    .single();
  check('A cria hábito', !he, he?.message);
  const { error: ee } = await A.c.from('habit_entries').insert({ habit_id: ha.id, user_id: A.uid, local_date: '2026-10-16', value: 25 });
  check('A registra 25 min', !ee, ee?.message);

  // RLS: B não vê hábito "friends" de A sem amizade
  const { data: hb } = await B.c.from('habits').select('id').eq('owner_id', A.uid);
  check('B não vê hábito friends de A', (hb ?? []).length === 0);
  await A.c.from('habits').update({ visibility: 'public' }).eq('id', ha.id);
  const { data: hb2 } = await B.c.from('habits').select('id').eq('owner_id', A.uid);
  check('B vê hábito depois de público', (hb2 ?? []).length === 1);

  // B não consegue inserir registro no hábito de A
  const { error: forbidden } = await B.c.from('habit_entries').insert({ habit_id: ha.id, user_id: B.uid, local_date: '2026-10-16', value: 1 });
  check('B não registra no hábito de A', !!forbidden);

  // clube
  const { data: club, error: ce } = await A.c.from('clubs').insert({ owner_id: A.uid, name: 'Clube E2E', description: '', is_public: false }).select('*').single();
  check('A cria clube', !ce && !!club?.invite_code, ce?.message);
  const { data: m1 } = await A.c.from('club_members').select('*').eq('club_id', club.id);
  check('A virou owner automaticamente', m1?.length === 1 && m1[0].role === 'owner');

  const { data: bClubsBefore } = await B.c.from('clubs').select('id').eq('id', club.id);
  check('B não vê clube privado antes de entrar', (bClubsBefore ?? []).length === 0);

  const { data: joinedId, error: je } = await B.c.rpc('join_club', { code: club.invite_code.toLowerCase() });
  check('B entra com código (case-insensitive)', !je && joinedId === club.id, je?.message);
  const { data: m2 } = await B.c.from('club_members').select('*, profile:profiles(display_name)').eq('club_id', club.id);
  check('B vê 2 membros com perfil', m2?.length === 2 && m2.every((m) => m.profile?.display_name), JSON.stringify(m2?.map((m) => m.profile)));

  // desafio por hábito (unidade min)
  const { data: ch, error: che } = await A.c
    .from('challenges')
    .insert({
      club_id: club.id, creator_id: A.uid, name: 'Minutos de leitura', starts_on: '2026-10-01', ends_on: '2026-10-31',
      spec: { metric: 'habit', unit: 'min', aggregate: 'sum', win: 'highest' }, proof: 'none', verified_only: false, bet: null, state: 'active',
    })
    .select('*')
    .single();
  check('A (admin) cria desafio', !che, che?.message);

  const { error: bChallengeForbidden } = await B.c.from('challenges').insert({
    club_id: club.id, creator_id: B.uid, name: 'x', starts_on: '2026-10-01', ends_on: '2026-10-31',
    spec: { metric: 'steps', aggregate: 'sum', win: 'highest' },
  });
  check('B (membro) não cria desafio', !!bChallengeForbidden);

  const { data: hbOwn } = await B.c.from('habits').insert({ owner_id: B.uid, name: 'Leitura B', kind: 'duration', unit: 'min', goal_value: 30 }).select('*').single();
  await B.c.from('habit_entries').insert([
    { habit_id: hbOwn.id, user_id: B.uid, local_date: '2026-10-10', value: 40 },
    { habit_id: hbOwn.id, user_id: B.uid, local_date: '2026-09-30', value: 999 }, // fora do período
  ]);
  const { error: pa1 } = await A.c.from('challenge_participants').insert({ challenge_id: ch.id, user_id: A.uid, habit_id: ha.id });
  const { error: pb1 } = await B.c.from('challenge_participants').insert({ challenge_id: ch.id, user_id: B.uid, habit_id: hbOwn.id });
  check('A e B entram no desafio', !pa1 && !pb1, pa1?.message ?? pb1?.message);

  const { error: cheat } = await B.c.from('challenge_participants').update({ habit_id: ha.id }).eq('challenge_id', ch.id).eq('user_id', B.uid);
  const { data: pbCheck } = await B.c.from('challenge_participants').select('habit_id').eq('challenge_id', ch.id).eq('user_id', B.uid).single();
  check('B não aponta hábito de A no desafio', !!cheat || pbCheck?.habit_id === hbOwn.id);

  const { data: lb, error: lbe } = await B.c.rpc('challenge_leaderboard', { challenge: ch.id });
  check('ranking tem 2 linhas', !lbe && lb?.length === 2, lbe?.message);
  check('ranking: B 40 > A 25, fora do período ignorado', lb?.[0]?.user_id === B.uid && Number(lb[0].score) === 40 && Number(lb[1].score) === 25, JSON.stringify(lb));

  // B não lê registros brutos de A (hábito voltou a friends)
  await A.c.from('habits').update({ visibility: 'friends' }).eq('id', ha.id);
  const { data: rawA } = await B.c.from('habit_entries').select('id').eq('user_id', A.uid);
  check('B não lê registros brutos de A, mas vê a pontuação', (rawA ?? []).length === 0);

  // amizade: B pede, A aceita, B passa a ver hábito friends
  const { error: fe } = await B.c.from('friendships').insert({ requester_id: B.uid, addressee_id: A.uid });
  check('B pede amizade', !fe, fe?.message);
  const { error: fae } = await A.c.from('friendships').update({ status: 'accepted' }).eq('requester_id', B.uid).eq('addressee_id', A.uid);
  check('A aceita', !fae, fae?.message);
  const { data: hb3 } = await B.c.from('habits').select('id').eq('owner_id', A.uid);
  check('B vê hábito friends de A após amizade', (hb3 ?? []).length === 1);

  // feed
  const { data: ev, error: eve } = await A.c.from('feed_events').insert({ user_id: A.uid, kind: 'entry', visibility: 'friends', habit_id: ha.id, payload: { value: 25 } }).select('*').single();
  check('A publica evento no feed', !eve, eve?.message);
  const { error: re } = await B.c.from('reactions').insert({ event_id: ev.id, user_id: B.uid, emoji: '🔥' });
  check('B reage ao evento do amigo', !re, re?.message);

  // sair do clube
  const { error: le } = await B.c.from('club_members').delete().eq('club_id', club.id).eq('user_id', B.uid);
  const { data: m3 } = await A.c.from('club_members').select('user_id').eq('club_id', club.id);
  check('B sai do clube', !le && m3?.length === 1, le?.message);
} catch (e) {
  failures++;
  console.log('FAIL exceção:', e.message ?? e);
} finally {
  for (const id of created) {
    const { error } = await admin.auth.admin.deleteUser(id);
    console.log(error ? `FAIL cleanup ${id}: ${error.message}` : `OK   cleanup ${id}`);
  }
  console.log(failures ? `\n${failures} falha(s)` : '\nTudo passou');
  process.exit(failures ? 1 : 0);
}
