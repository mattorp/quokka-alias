import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

/**
 * Returns the base directory of the workspace.
 *
 * @returns The base directory or null if no workspace folder is found.
 * @throws {Error} If no workspace folder is found.
 */
export const getBaseDir = (): string => {
  const baseDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath
  if (!baseDir) {
    throw new Error('No workspace folder found')
  }
  return baseDir
}

/**
 * Get the nearest tsconfig.json file path based on the given file path
 *
 * @param filepath - The file path to use.
 * @returns The tsconfig.json file path.
 * @throws "No tsconfig.json file found higher up in the directory" if no tsconfig.json file is found.
 */
export const getTsConfigPath = (filepath: string): string => {
  const baseDir = getBaseDir()
  const dirPath = filepath.replace(baseDir, '')
  const dirPathsToCheck = dirPath.split(path.sep)
  let tsConfigPath = ''
  while (dirPathsToCheck.length > 0) {
    const dirPathToCheck = dirPathsToCheck.join(path.sep)
    const tsConfigPathToCheck = path.join(
      baseDir,
      dirPathToCheck,
      'tsconfig.json'
    )
    if (fs.existsSync(tsConfigPathToCheck)) {
      tsConfigPath = tsConfigPathToCheck
      break
    }
    dirPathsToCheck.pop()
  }

  if (!fs.existsSync(tsConfigPath)) {
    throw new Error('No tsconfig.json file found higher up in the directory')
  }
  return tsConfigPath
}

/**
 * Parse TypeScript configuration paths
 *
 * @param tsConfig - The TypeScript configuration object.
 * @returns Parsed paths.
 */
export const parseTsConfigPaths = (tsConfig: any) => {
  return Object.entries(tsConfig.compilerOptions.paths || {}) as [
    string,
    string[]
  ][]
}

/**
 * Returns the path to the tsconfig.json file and checks if it exists and contains paths.
 *
 * @returns The path to the tsconfig.json file.
 * @throws {Error} If the tsconfig.json file is not found in the root directory, or if it does not contain paths.
 */
export const getTsConfig = (filepath: string): Record<string, any> => {
  const tsConfig = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
  if (!tsConfig.compilerOptions.paths) {
    throw new Error(
      'No paths key found in tsconfig.json. You can leave it empty if this is intentional.'
    )
  }
  return tsConfig
}

export const openQuokkaFile = (quokkaPath: string): void => {
  vscode.workspace.openTextDocument(quokkaPath).then((doc) => {
    vscode.window.showTextDocument(doc)
  })
}

export const getWorkspaceRoot = (): string => {
  return vscode.workspace.workspaceFolders?.[0].uri.fsPath as string
}

/**
 * Finds all import statements in a file's content.
 *
 * @param {string} fileContent - The content of the file.
 * @returns {string[]} - The import paths found in the file.
 */
export const findImportStatements = (fileContent: string): string[] => {
  const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g
  let match
  let importPaths = []
  while ((match = importRegex.exec(fileContent)) !== null) {
    importPaths.push(match[1])
  }
  return importPaths
}
