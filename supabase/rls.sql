-- ═══════════════════════════════════════════════════════════
-- VALMONT — Políticas RLS
-- Ejecutar en Supabase SQL Editor una sola vez
-- ═══════════════════════════════════════════════════════════

-- Habilitar RLS en todas las tablas
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

-- ── products ────────────────────────────────────────────────
-- Cualquiera puede leer productos publicados (tienda pública)
-- pero price_cost nunca se expone vía RLS (lo maneja la API)
CREATE POLICY "productos_publicos_read"
  ON products FOR SELECT
  USING (is_published = true);

-- Solo usuarios autenticados pueden hacer todo
CREATE POLICY "productos_admin_all"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── orders ───────────────────────────────────────────────────
-- Insertar orders es público (checkout sin cuenta)
CREATE POLICY "orders_insert_public"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Leer una order propia (por ID, desde la página de confirmación)
CREATE POLICY "orders_select_by_id"
  ON orders FOR SELECT
  USING (true);

-- Admin puede hacer todo
CREATE POLICY "orders_admin_all"
  ON orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── sales ────────────────────────────────────────────────────
-- Solo admin
CREATE POLICY "sales_admin_all"
  ON sales FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── telegram_sessions ────────────────────────────────────────
-- Solo service_role (el bot usa la service role key)
CREATE POLICY "telegram_service_only"
  ON telegram_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
