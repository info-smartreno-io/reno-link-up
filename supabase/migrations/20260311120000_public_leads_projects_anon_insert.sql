-- Ensure anonymous users can submit marketing leads and public projects safely.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'leads'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'leads'
        AND policyname = 'Anon can insert leads'
    ) THEN
      CREATE POLICY "Anon can insert leads"
      ON public.leads
      FOR INSERT
      TO anon
      WITH CHECK (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'projects'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'projects'
        AND policyname = 'Anon can insert marketing projects'
    ) THEN
      CREATE POLICY "Anon can insert marketing projects"
      ON public.projects
      FOR INSERT
      TO anon
      WITH CHECK (homeowner_id IS NULL);
    END IF;
  END IF;
END $$;
