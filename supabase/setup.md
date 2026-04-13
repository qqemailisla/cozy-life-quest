## Supabase setup

1. Open your Supabase project.
2. In `SQL Editor`, run [`schema.sql`](D:/Workbench/game/supabase/schema.sql).
3. In `Authentication > URL Configuration`, add these redirect URLs:
   - `https://qqemailisla.github.io/cozy-life-quest/`
   - `http://localhost:8000/`
4. In `Project Settings > API`, copy:
   - `Project URL`
   - `anon public key`
5. In the app settings dialog, paste those two values, then send yourself a magic link.

The app stores one merged JSON state per user in `public.cozy_life_states`.
