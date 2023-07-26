// main.ts
import yargs from "yargs"
import { migrate, reset, createMigration, migrateAndGenerate } from "./"

yargs
  .command(
    "create-migration <name>",
    "creates a new migration",
    (yargs) => {
      yargs.positional("name", {
        describe: "Name for the migration",
        type: "string",
      })
    },
    (argv) => {
      createMigration(argv.name as string)
    }
  )
  .command("reset", "resets the database", {}, () => {
    reset()
  })
  .command("migrate", "migrates the database", {}, () => {
    migrate()
  })
  .command(
    "migrate-and-generate",
    "migrates and generates the database",
    {},
    () => {
      migrateAndGenerate()
    }
  )
  .parse()
