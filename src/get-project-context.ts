import fs from "fs"
import path from "path"

export type Context = {
  cwd: string
  defaultDatabase: string
  schemas: string[]

  dbDir?: string
}

export const getProjectContext = async (): Promise<Context> => {
  if (!fs.existsSync(path.join(process.cwd(), "seam-pgm.config.js"))) {
    throw new Error(
      `You must have a seam-pgm.config.js file in your project root`
    )
  }

  const config = await import(path.join(process.cwd(), "seam-pgm.config.js"))

  return {
    cwd: process.cwd(),
    ...(config.default ?? config),
  }
}
