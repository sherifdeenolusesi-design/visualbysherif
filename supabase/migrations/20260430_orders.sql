-- ─────────────────────────────────────────────────────────────────────────────
-- Orders table — created by webhook after Stripe confirms payment
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id         TEXT        UNIQUE NOT NULL,
  stripe_payment_intent_id  TEXT,
  stripe_customer_id        TEXT,
  product_id                UUID        REFERENCES print_products(id) ON DELETE SET NULL,
  product_title             TEXT,
  size                      TEXT        NOT NULL,
  quantity                  INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  amount_total              INTEGER     NOT NULL CHECK (amount_total >= 0),
  currency                  TEXT        NOT NULL DEFAULT 'gbp',
  customer_name             TEXT,
  customer_email            TEXT        NOT NULL,
  shipping_name             TEXT,
  shipping_line1            TEXT,
  shipping_line2            TEXT,
  shipping_city             TEXT,
  shipping_state            TEXT,
  shipping_postal_code      TEXT,
  shipping_country          TEXT,
  status                    TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','paid','processing','shipped','fulfilled','refunded','disputed')),
  notes                     TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookups
CREATE INDEX IF NOT EXISTS orders_customer_email_idx   ON orders (customer_email);
CREATE INDEX IF NOT EXISTS orders_status_idx           ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx       ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_intent_idx   ON orders (stripe_payment_intent_id);

-- Row-level security: only service-role (webhook) can write; no public read
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_public_access" ON orders FOR ALL TO public USING (false);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Atomic stock decrement RPC — prevents overselling under concurrent orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE print_products
  SET stock = GREATEST(0, stock - p_qty)
  WHERE id = p_product_id AND stock >= p_qty;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;
END;
$$;
