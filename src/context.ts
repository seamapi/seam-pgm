export type Context = {
  cwd: string
}

export const getContext = () => {
  return {
    cwd: process.cwd(),
  }
}
