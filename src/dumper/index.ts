import { Client } from "pg"
import fs from "fs"
import { Context } from "../get-project-context"
import { getConnectionStringFromEnv } from "pg-connection-from-env"

type DumperContext = {
  client: Client
  schemas: string[]
}

const getTables = async (context: DumperContext) => {
  const { client, schemas } = context
  const { rows } = await client.query(`
    SELECT tablename, schemaname FROM pg_tables
    WHERE schemaname IN (${schemas.map((s) => `'${s}'`).join(",")});
  `)

  return rows.map((row) => `${row.schemaname}.${row.tablename}`)
}

const getTableDefinition = async (
  tableWithSchema: string,
  context: DumperContext
) => {
  const { client } = context
  const [schema, table] = tableWithSchema.split(".")

  const { rows } = await client.query(
    `
    SELECT column_name, data_type, is_nullable, column_default
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = $1 AND table_schema = $2;
  `,
    [table, schema]
  )

  return `CREATE TABLE ${schema}.${table} (
    ${rows
      .map(
        (row) =>
          `${row.column_name} ${row.data_type.toUpperCase()} ${
            row.is_nullable === "YES" ? "NULL" : "NOT NULL"
          } DEFAULT ${row.column_default || "NULL"}`
      )
      .join(",\n")}
  );\n`
}

const getTableConstraints = async (
  tableWithSchema: string,
  context: DumperContext
) => {
  const { client } = context
  const [schema, table] = tableWithSchema.split(".")
  const { rows } = await client.query(
    `
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = $1 AND relnamespace = n.oid LIMIT 1) 
      AND n.nspname = $2;
  `,
    [table, schema]
  )

  return rows
    .map(
      (row) =>
        `ALTER TABLE ${table} ADD CONSTRAINT ${row.conname} ${row.pg_get_constraintdef};\n`
    )
    .join("")
}

const getFunctions = async (context: DumperContext) => {
  const { client, schemas } = context
  const { rows } = await client.query(`
    SELECT pg_get_functiondef(f.oid)
    FROM pg_catalog.pg_proc f
    INNER JOIN pg_catalog.pg_namespace n ON (f.pronamespace = n.oid)
    WHERE n.nspname IN (${schemas.map((s) => `'${s}'`).join(",")})
    AND f.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype
    AND n.oid NOT IN (SELECT extnamespace FROM pg_extension);
  `)

  return rows.map((row) => `${row.pg_get_functiondef}\n`).join("")
}

const getTriggers = async (context: DumperContext) => {
  const { client, schemas } = context
  const { rows } = await client.query(`
    SELECT event_object_table, action_statement, action_orientation, action_timing
    FROM information_schema.triggers
    WHERE trigger_schema IN (${schemas.map((s) => `'${s}'`).join(",")})
  `)

  return rows
    .map(
      (row) =>
        `CREATE TRIGGER ON ${row.event_object_table} ${row.action_timing} ${row.action_orientation} EXECUTE ${row.action_statement}\n`
    )
    .join("")
}

const main = async (ctx: Context) => {
  const client = new Client({
    connectionString: getConnectionStringFromEnv({
      fallbackDefaults: {
        database: ctx.defaultDatabase,
      },
    }),
  })
  await client.connect()

  const dumperContext: DumperContext = {
    client,
    schemas: ctx.schemas,
  }

  const tables = await getTables(dumperContext)
  let sql = ""

  // TODO get extensions

  for (const table of tables) {
    const tableDefinition = await getTableDefinition(table, dumperContext)
    const tableConstraints = await getTableConstraints(table, dumperContext)
    // TODO get indexes
    sql += tableDefinition + tableConstraints
  }

  const functions = await getFunctions(dumperContext)
  sql += functions

  // const triggers = await getTriggers(dumperContext)
  // sql += triggers

  // TODO get grants

  fs.writeFileSync("schema.sql", sql)

  await client.end()
}

main({
  cwd: process.cwd(),
  defaultDatabase: "seam_api",
  schemas: ["seam", "august"],
})
