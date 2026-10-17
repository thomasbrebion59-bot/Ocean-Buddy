-- Contrôle en LECTURE SEULE du modèle d'accès de la communauté (aucune écriture).
-- À lancer dans l'éditeur SQL du projet Supabase de DEV, puis de production si vous le décidez.
-- Résultat attendu : chaque ligne a rls = true, policies = 0, anon_grants = '' et authenticated_grants = ''.
-- Toute autre valeur veut dire qu'un client muni de la clé publique peut lire ou écrire la table.
select c.relname as table_name,
       c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as policies,
       coalesce((select string_agg(privilege_type, ',' order by privilege_type) from information_schema.role_table_grants g
                 where g.table_schema = 'public' and g.table_name = c.relname and g.grantee = 'anon'), '') as anon_grants,
       coalesce((select string_agg(privilege_type, ',' order by privilege_type) from information_schema.role_table_grants g
                 where g.table_schema = 'public' and g.table_name = c.relname and g.grantee = 'authenticated'), '') as authenticated_grants
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relname;
