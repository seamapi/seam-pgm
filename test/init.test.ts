import test from "ava"
import mockFS from "mock-fs"
import fs from "fs"
import os from "os"
import child_process from "child_process"
import path from "path"
import { initSeamNodePgMigrate } from "../src/init"
import { getTestPostgresDatabaseFactory } from "ava-postgres"

export const initialVfs = {
  "package.json": JSON.stringify({
    name: "some-package",
  }),
}

let testDir: string

test.beforeEach(() => {
  // create a temporary directory representing the filesystem
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-"))

  // create the files from the filesystem config
  for (const [filepath, contents] of Object.entries(initialVfs)) {
    const fullPath = path.join(testDir, filepath)
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, contents)
  }
})

test.afterEach(() => {
  // clean up the test directory
  fs.rm(testDir, { recursive: true }, () => {})
})

const getTestDatabase = getTestPostgresDatabaseFactory({
  postgresVersion: "14",
})

test("initialize project with seam-node-pg-migrate", async (t) => {
  const { pool, connectionString } = await getTestDatabase()

  await initSeamNodePgMigrate({ cwd: testDir })
  t.truthy(
    fs
      .readFileSync(path.join(testDir, "package.json"))
      .toString()
      .includes("db:migrate")
  )

  const shellOpts: Parameters<typeof child_process.execSync>[1] = {
    cwd: testDir,
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  }

  child_process.execSync("npm install", shellOpts)

  child_process.execSync(
    "npm run db:create-migration some-migration",
    shellOpts
  )

  // Read files from directory and check that the migration was created
  const migrationFiles = fs.readdirSync(path.join(testDir, "src/db/migrations"))
  console.log({ migrationFiles })
  const migrationFile = migrationFiles.find((file) =>
    file.includes("some-migration")
  )
  t.truthy(migrationFile)

  // Edit the "function up() {" inside the migration file to create a table
  // called "test_table" with a column called "test_column" of type "text"
  const migrationContent = fs.readFileSync(
    path.join(testDir, `src/db/migrations/${migrationFile}`),
    "utf8"
  )
  console.log(migrationContent)
  const newMigrationContent = migrationContent.replace(
    "up(pgm: MigrationBuilder): Promise<void> {",
    `up(pgm: MigrationBuilder): Promise<void> {
pgm.createTable("test_table", {
  test_column: "text"
});`
  )
  fs.writeFileSync(
    path.join(testDir, `src/db/migrations/${migrationFile}`),
    newMigrationContent
  )

  // Run the migration using "npm run db:migrate"
  child_process.execSync("npm run db:migrate", shellOpts)

  // Connect to database and insert into test_table
  await pool.query("INSERT INTO test_table (test_column) VALUES ('test')")

  // Run "npm run db:reset" and confirm that the entry in test table was
  // removed, but test_table was re-created
  child_process.execSync("npm run db:reset", shellOpts)

  console.log(await pool.query("SELECT * FROM test_table"))
})
