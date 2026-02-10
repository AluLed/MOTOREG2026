-- 1. Habilitar extensión para UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabla de Participantes (Base de Datos Anual)
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    moto_number TEXT NOT NULL,
    category TEXT NOT NULL,
    phone TEXT NOT NULL,
    residence TEXT NOT NULL,
    registration_date TIMESTAMPTZ DEFAULT now(),
    access_code TEXT NOT NULL
);

-- 3. Tabla de Entradas de Transponder (Carrera en Curso)
CREATE TABLE IF NOT EXISTS transponder_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de Ajustes del Sistema (Estado del registro, nombre de carrera)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 5. Insertar valores iniciales para configuración
INSERT INTO settings (key, value) 
VALUES 
    ('registration_open', 'true'),
    ('race_name', 'Carrera General')
ON CONFLICT (key) DO NOTHING;

-- 6. Configuración de Políticas de Seguridad (RLS)
-- Nota: Para que la app funcione directamente como está diseñada, 
-- habilitamos acceso público. En producción se recomienda usar Auth.

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transponder_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso total (Lectura/Escritura) para usuarios anónimos
CREATE POLICY "Acceso Publico Participantes" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso Publico Transponders" ON transponder_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso Publico Ajustes" ON settings FOR ALL USING (true) WITH CHECK (true);

-- 7. Índices para mejorar la velocidad de búsqueda
CREATE INDEX IF NOT EXISTS idx_participants_moto ON participants(moto_number);
CREATE INDEX IF NOT EXISTS idx_participants_code ON participants(access_code);