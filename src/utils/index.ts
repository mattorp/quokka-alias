/**
 * @file Utility functions for the Quokka TypeScript Path Alias extension.
 *
 * This module contains utility functions to assist with common tasks:
 * - Getting the base directory of the workspace
 * - Parsing TypeScript configuration paths
 * - Creating a regex for finding import paths
 * - Finding import paths in file content
 * - Getting the active file path
 * - Getting the tsconfig.json file
 * - Opening the Quokka file
 * - Asserting that an import path exists
 *
 * @module utils
 */

import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

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
 * Create a regex to find import paths
 *
 * @param key - The key to use in the regex.
 * @returns The regex.
 */
export const createImportRegex = (key: string): RegExp => {
  return new RegExp(
    `import(?:\\s+\\w+\\s*=\\s*require\\(["']|["'\\s]*[\\w*{}\\n\\r\\t, ]+from\\s*)?(?:["'\\s]*)([${key}][^\\s'"]+)(?:["'\\s].*)?`,
    'g'
  )
}

/**
 * Find import paths in file content
 *
 * @param fileContent - The content of the file containing the imports.
 * @param regex - The regex to use to find the import paths.
 * @returns Import paths.
 */
export const findImportPaths = (
  fileContent: string,
  regex: RegExp
): string[] => {
  const importPaths: string[] = []
  let match

  while ((match = regex.exec(fileContent)) !== null) {
    importPaths.push(match[1])
  }

  return importPaths
}

/**
 * Returns the file path of the active text editor.
 *
 * @returns The file path or null if no file is active.
 * @throws {Error} If no file is active or the file is not a typescript file.
 */
export const getActiveFilePath = (): string => {
  const filePath = vscode.window.activeTextEditor?.document.fileName
  if (!filePath) {
    throw new Error('No file is active')
  }
  if (!filePath.endsWith('.ts')) {
    throw new Error('Current file is not a typescript file')
  }
  return filePath
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

/**
 * Assert that the import path exists
 *
 * @param newAlias - The new alias to check.
 * @returns Whether the import path exists.
 */
export const assertImportPathExists = (newAlias: string) => {
  const baseDir = getBaseDir()
  if (
    !['', '.ts', '/index.ts'].some((ext) =>
      fs.existsSync(path.join(baseDir, newAlias + ext))
    )
  ) {
    vscode.window.showInformationMessage(
      `Import path ${newAlias} does not exist`
    )
    return false
  }
  return true
}
