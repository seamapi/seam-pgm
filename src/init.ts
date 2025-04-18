import type { Context } from "./get-project-context"
import path from "path"
import * as fs from "fs"
import seamPGMPackage from "../package.json"

export const initSeamPgm = async (ctx: Pick<Context, "cwd">) => {
  const { cwd } = ctx
  const pkg = JSON.parse(
    fs.readFileSync(path.join(cwd, "package.json")).toString(),
  )

  if (!pkg.devDependencies) pkg.devDependencies = {}
  if (!pkg.devDependencies["seam-pgm"]) {
    pkg.devDependencies["seam-pgm"] =
      process.env.SEAM_PGM_VERSION ?? seamPGMPackage.version

    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify(pkg, null, 2),
    )
  }

  if (!fs.existsSync(path.join(cwd, "seam-pgm.config.js"))) {
    fs.writeFileSync(
      path.join(cwd, "seam-pgm.config.js"),
      `module.exports = ${JSON.stringify(
        {
          defaultDatabase: "my_service_name",
          schemas: ["public"],
        },
        null,
        2,
      )}`,
    )
  }
}
