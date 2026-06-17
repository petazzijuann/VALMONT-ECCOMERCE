-- Habilitar RLS en tablas expuestas a PostgREST.
-- La service_role (usada por Prisma) bypasea RLS automáticamente,
-- por lo que no se necesitan políticas — el acceso server-side no cambia.
-- Sin políticas, el acceso vía anon key / Supabase client queda bloqueado.

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prode_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prode_match_predictions ENABLE ROW LEVEL SECURITY;
