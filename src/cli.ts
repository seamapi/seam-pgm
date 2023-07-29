#!/usr/bin/env node
import yargs from "yargs"
import { migrate, reset, generate, createMigration } from "./"
import { getProjectContext } from "./get-project-context"

yargs
  .command(
    "create-migration [name]",
    "create a new migration",
    (yargs) => {
      yargs.positional("name", {
        describe: "name of the migration file",
        type: "string",
      })
    },
    (argv) => {
      createMigration(argv.name as string)
    }
  )
  .command("reset", "resets the database", {}, async () => {
    await reset(getProjectContext())

    // Reset hangs, probably due to unclosed pg connection
    process.exit(0)
  })
  .command("migrate", "migrates the database", {}, () => {
    migrate()
  })
  .command(
    "generate",
    "generate types and sql documentation from database",
    {},
    () => {
      // migrateAndGenerate()
    }
  )
  .parse()
