-- Um participante só pode apontar um hábito que pertença a ele mesmo,
-- tanto ao entrar quanto ao editar (a policy de update não tinha WITH CHECK).
drop policy challenge_participants_update on challenge_participants;
create policy challenge_participants_update on challenge_participants for update to authenticated
  using (user_id = auth.uid()
      or exists (select 1 from challenges c where c.id = challenge_id and is_club_admin(c.club_id, auth.uid())))
  with check (habit_id is null
      or exists (select 1 from habits h where h.id = habit_id and h.owner_id = user_id));
