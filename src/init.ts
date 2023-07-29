import type { Context } from "./get-project-context"
import path from "path"
import * as fs from "fs"
import seamPGMPackage from "../package.json"

export const initSeamNodePgMigrate = async (ctx: Pick<Context, "cwd">) => {
  const { cwd } = ctx
  const pkg = JSON.parse(
    fs.readFileSync(path.join(cwd, "package.json")).toString()
  )

  if (!pkg.scripts) pkg.scripts = {}

  pkg.scripts["db:migrate"] = "seam-pgm migrate"
  pkg.scripts["db:reset"] = "seam-pgm reset"
  pkg.scripts["db:generate"] = "seam-pgm generate"
  pkg.scripts["db:create-migration"] = "seam-pgm create-migration"

  if (!pkg.devDependencies) pkg.devDependencies = {}
  if (!pkg.devDependencies["seam-pgm"]) {
    pkg.devDependencies["seam-pgm"] =
      process.env.SEAM_PGM_VERSION ?? seamPGMPackage.version
  }

  if (!fs.existsSync(path.join(cwd, "seam-pgm.config.json"))) {
    fs.writeFileSync(
      path.join(cwd, "seam-pgm.config.json"),
      JSON.stringify(
        {
          defaultDatabase: "my_service_name",
        },
        null,
        2
      )
    )
  }

  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify(pkg, null, 2))
}
