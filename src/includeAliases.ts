/**
 * @file This module provides functionality for generating and updating aliases in a .quokka file based on the imports in a TypeScript file.
 */

import fs from 'fs'
import path from 'path'
import vscode from 'vscode'
import {
  findImportStatements,
  getTsConfig,
  getTsConfigPath,
  getWorkspaceRoot,
  parseTsConfigPaths,
} from './utils'
import {
  assertFileExists,
  assertQuokkaFileExists,
  getActiveFilePath,
  getPathToQuokkaFile,
} from './utils/files'

/**
 * Generates aliases for TypeScript paths.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.importPath - The import path.
 * @param {[string, string[]][]} params.tsPaths - The TypeScript paths.
 * @param {string} params.workspaceRoot - The root of the workspace.
 * @param {string} params.quokkaDir - The Quokka directory.
 * @returns {Record<string, string>} - The new aliases.
 */
const generateAliasForTsPath = ({
  importPath,
  tsPaths,
  workspaceRoot,
  quokkaDir,
}: {
  importPath: string
  tsPaths: [string, string[]][]
  workspaceRoot: string
  quokkaDir: string
}) => {
  const newAliases = {} as Record<string, string>
  for (const tsPath of tsPaths) {
    const key = tsPath[0].replace('/*', '')
    if (!importPath.startsWith(key)) {
      return
    }

    const value = tsPath[1][0].replace('/*', '')
    const newAlias = importPath.replace(key, value)
    const fullPath = assertFileExists(
      path.join(workspaceRoot, quokkaDir, newAlias)
    )

    if (!fullPath) {
      return
    }

    newAliases[importPath] = newAlias
    const traversedAliases = generateNewAliases(fullPath, tsPaths, quokkaDir)
    Object.assign(newAliases, traversedAliases)
  }
  return newAliases
}

/**
 * Traverses relative paths and generates new aliases.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.importPath - The import path.
 * @param {string} params.filePath - The file path.
 * @param {[string, string[]][]} params.tsPaths - The TypeScript paths.
 * @param {string} params.quokkaDir - The Quokka directory.
 * @returns {Record<string, string> | undefined} - The new aliases, or undefined if the import path is not relative.
 */
const traverseRelativePaths = ({
  importPath,
  filePath,
  tsPaths,
  quokkaDir,
}: {
  importPath: string
  filePath: string
  tsPaths: [string, string[]][]
  quokkaDir: string
}) => {
  if (!importPath.startsWith('.')) {
    return
  }

  const resolvedPath = assertFileExists(
    path.resolve(path.dirname(filePath), importPath)
  )

  if (!resolvedPath) {
    return
  }

  return generateNewAliases(resolvedPath, tsPaths, quokkaDir)
}

/**
 * Generates new aliases based on the file content and TypeScript paths.
 *
 * @param {string} filePath - The path of the file.
 * @param {[string, string[]][]} tsPaths - The TypeScript paths.
 * @param {string} quokkaDir - The Quokka directory.
 * @returns {Record<string, string>} - The new aliases.
 */
const generateNewAliases = (
  filePath: string,
  tsPaths: [string, string[]][],
  quokkaDir: string
): Record<string, string> => {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const importPaths = findImportStatements(fileContent)
  const newAliases = {} as Record<string, string>

  const args = {
    filePath,
    tsPaths,
    workspaceRoot: getWorkspaceRoot(),
    quokkaDir,
    newAliases,
  }

  for (const importPath of importPaths) {
    Object.assign(newAliases, {
      ...generateAliasForTsPath({ importPath, ...args }),
      ...traverseRelativePaths({ importPath, ...args }),
    })
  }

  return newAliases
}

/**
 * Merge existing aliases with new ones and update the .quokka file
 *
 * @param quokkaPath - The path to the .quokka file.
 * @param quokkaConfig - The Quokka configuration object.
 * @param newAliases - The new aliases to merge.
 */
const updateQuokkaFile = (
  quokkaPath: string,
  quokkaConfig: any,
  newAliases: Record<string, string>
) => {
  const updatedAliases = { ...quokkaConfig.alias, ...newAliases }
  quokkaConfig.alias = updatedAliases
  fs.writeFileSync(quokkaPath, JSON.stringify(quokkaConfig, null, 2))
}

/**
 * Updates the aliases in the `.quokka` file based on the imports in the provided file.
 *
 * @param filePath - The path to the file containing the imports.
 * @param quokkaPath - The path to the .quokka file.
 * @param tsConfigPath - The path to the tsconfig.json file.
 */
const updateQuokkaAliases = (
  filePath: string,
  quokkaPath: string,
  tsConfig: Record<string, any>
) => {
  const quokkaConfig = JSON.parse(fs.readFileSync(quokkaPath, 'utf-8'))
  const tsPaths = parseTsConfigPaths(tsConfig)
  const pathToQuokkaFile = getPathToQuokkaFile(quokkaPath)

  const newAliases = generateNewAliases(filePath, tsPaths, pathToQuokkaFile)
  updateQuokkaFile(quokkaPath, quokkaConfig, newAliases)
}

/**
 * Includes aliases in the `.quokka` file based on the imports in the active file.
 */

export const includeAliases = async () => {
  try {
    const filePath = getActiveFilePath()
    const tsConfigPath = getTsConfigPath(filePath)
    const quokkaPath = tsConfigPath.replace('tsconfig.json', '.quokka')
    await assertQuokkaFileExists(quokkaPath)
    const tsConfig = getTsConfig(tsConfigPath)
    updateQuokkaAliases(filePath, quokkaPath, tsConfig)
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message)
  }
}
