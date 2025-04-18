import type { Context } from "./get-project-context"
import path from "path"
import * as fs from "fs"

export const installScripts = async (ctx: Pick<Context, "cwd">) => {
  const { cwd } = ctx
  const pkg = JSON.parse(
    fs.readFileSync(path.join(cwd, "package.json")).toString(),
  )

  if (!pkg.scripts) pkg.scripts = {}

  pkg.scripts["db:migrate"] = "seam-pgm migrate"
  pkg.scripts["db:reset"] = "seam-pgm reset"
  pkg.scripts["db:generate"] = "seam-pgm generate"
  pkg.scripts["db:create-migration"] = "seam-pgm create-migration"

  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify(pkg, null, 2))
}
