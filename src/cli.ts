#!/usr/bin/env node
import yargs from "yargs"
import { migrate, reset, generate, createMigration, initSeamPgm } from "./"
import { getProjectContext } from "./get-project-context"

yargs
  .command("init", "initialize seam-pgm", {}, async () => {
    await initSeamPgm({
      cwd: process.cwd(),
    })
  })
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
    await reset(await getProjectContext())

    // Reset hangs, probably due to unclosed pg connection
    process.exit(0)
  })
  .command("migrate", "migrates the database", {}, async () => {
    migrate(await getProjectContext())
  })
  .command(
    "generate",
    "generate types and sql documentation from database",
    {},
    async () => {
      generate(await getProjectContext())
    }
  )
  .parse()
