// main.ts
import { program } from "commander"
import { migrate, reset, createMigration, migrateAndGenerate } from "./seam-pgm"

program.command("create-migration <name>").action((name) => {
  createMigration(name)
})

program.command("reset").action(() => {
  reset()
})

program.command("migrate").action(() => {
  migrate()
})

program.command("migrate-and-generate").action(() => {
  migrateAndGenerate()
})

program.parse()
