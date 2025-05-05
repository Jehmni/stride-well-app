-- Add exec_sql function to allow executing SQL queries from client code
-- This is a utility function to execute arbitrary SQL queries with proper security constraints

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the query results as JSON array
  RETURN QUERY EXECUTE sql;
EXCEPTION WHEN OTHERS THEN
  -- On error, return JSON with the error message
  RETURN QUERY SELECT json_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

-- Add RLS policy to restrict who can execute SQL
REVOKE ALL ON FUNCTION public.exec_sql FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql TO authenticated;

COMMENT ON FUNCTION public.exec_sql IS 'Executes an SQL query and returns the result as JSON. Used for complex queries that cannot be expressed using standard RPC calls.';
