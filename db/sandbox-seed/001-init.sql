CREATE TABLE departments (
  id integer PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE employees (
  id integer PRIMARY KEY,
  name text NOT NULL,
  department text NOT NULL,
  hired_at date NOT NULL,
  salary integer NOT NULL
);

INSERT INTO departments (id, name) VALUES
  (1, 'Engineering'),
  (2, 'Operations'),
  (3, 'Finance');

INSERT INTO employees (id, name, department, hired_at, salary) VALUES
  (1, 'Asha', 'Engineering', '2026-01-08', 120000),
  (2, 'Ravi', 'Engineering', '2026-02-14', 118000),
  (3, 'Mina', 'Operations', '2026-01-22', 82000),
  (4, 'Dev', 'Finance', '2025-11-04', 93000),
  (5, 'Noor', 'Finance', '2026-03-10', 97000),
  (6, 'Ishan', 'Operations', '2026-04-19', 86000);

CREATE USER sandbox_ro WITH PASSWORD 'sandbox';
GRANT CONNECT ON DATABASE sandbox TO sandbox_ro;
GRANT USAGE ON SCHEMA public TO sandbox_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sandbox_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO sandbox_ro;
