export const pascalCase = (str: string): string => {
  return str.replace(/(_\w|^\w)/g, (match) =>
    match.replace("_", "").toUpperCase()
  )
}
