-- O dono precisa ler o clube na mesma instrução em que o cria (insert ... returning):
-- o trigger que o torna membro é AFTER INSERT e roda depois do RETURNING.
drop policy clubs_select on clubs;
create policy clubs_select on clubs for select to authenticated
  using (is_public or owner_id = auth.uid() or is_club_member(id, auth.uid()));
