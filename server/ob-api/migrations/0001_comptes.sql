-- Comptes Ocean Buddy : données de synchronisation (D1, Cloudflare). L'identité est vérifiée par Supabase Auth :
-- user_id = identifiant « sub » du jeton Supabase. Aucune adresse e-mail, aucune IP n'est stockée ici.
-- Retour arrière : D1 Time Travel (7 jours en offre gratuite).

CREATE TABLE accounts (
  user_id TEXT PRIMARY KEY CHECK (length(user_id) BETWEEN 1 AND 64),
  created_at INTEGER NOT NULL,
  consent_version TEXT CHECK (consent_version IS NULL OR length(consent_version) <= 20),
  consent_at INTEGER,
  rev INTEGER NOT NULL DEFAULT 0
);

-- Une ligne par élément synchronisé (voyage, note, favori, session, progression…).
CREATE TABLE sync_items (
  user_id TEXT NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('profile','fav','session','trip','note','progress','misc')),
  item_id TEXT NOT NULL CHECK (length(item_id) BETWEEN 1 AND 80),
  data TEXT NOT NULL CHECK (json_valid(data) AND length(data) <= 32768),
  deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
  updated_at INTEGER NOT NULL,
  rev INTEGER NOT NULL,
  PRIMARY KEY (user_id, kind, item_id)
) WITHOUT ROWID;
CREATE INDEX sync_items_pull ON sync_items (user_id, rev);

-- Jetons Apple (révocation à la suppression du compte, étape 3) : chiffrés, jamais renvoyés à un client.
CREATE TABLE apple_credentials (
  user_id TEXT PRIMARY KEY REFERENCES accounts(user_id) ON DELETE CASCADE,
  refresh_token_enc TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Identités Supabase à supprimer encore (si l'appel à Supabase a échoué au moment de la suppression) : reprises par la tâche planifiée.
CREATE TABLE identity_deletions (
  user_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
