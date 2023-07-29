import fs from "fs"
import path from "path"

export type Context = {
  cwd: string
  defaultDatabase: string
}

export const getProjectContext = () => {
  if (!fs.existsSync(path.join(process.cwd(), "seam-pgm.config.json"))) {
    throw new Error(
      `You must have a seam-pgm.config.json file in your project root`
    )
  }

  return {
    cwd: process.cwd(),
    ...JSON.parse(
      fs
        .readFileSync(path.join(process.cwd(), "seam-pgm.config.json"))
        .toString()
    ),
  }
}
