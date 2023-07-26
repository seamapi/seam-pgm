import test from "ava"
import mockFS from "mock-fs"
import fs from "fs"
import { initSeamNodePgMigrate } from "../src/init"

export const initialVfs = {
  "/app/package.json": JSON.stringify({
    name: "some-package",
  }),
}

test.before(() => {
  mockFS(initialVfs)
})

test.after(() => {
  mockFS.restore()
})

test("initialize project with seam-node-pg-migrate", async (t) => {
  await initSeamNodePgMigrate({ cwd: "/app" })
  console.log(fs.readFileSync("/app/package.json").toString())
})
