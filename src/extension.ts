/**
 * @description
 * This extension provides functionality to include aliases from the `tsconfig.json` file
 * into a `.quokka` file, enabling Quokka to resolve module imports based on TypeScript aliases.
 *
 * The main function, `activate`, is called when the extension is activated, and it registers
 * a command named "quokka-alias.include-aliases". When this command is executed, the extension
 * performs the following steps:
 *
 * 1. Check if a workspace folder is open, and if not, show an error message.
 * 2. Check if a TypeScript file is active in the text editor, and if not, show an error message.
 * 3. Check if a `.quokka` file exists in the root directory. If it doesn't, prompt the user
 *    to create one, and if they agree, create it with the required initial configuration.
 * 4. Check if a `tsconfig.json` file exists in the root directory, and if not, show an error message.
 * 5. Check if the `tsconfig.json` file contains a `paths` key. If it doesn't, show an error message.
 * 6. Parse the TypeScript aliases from the `tsconfig.json` file.
 * 7. Read the active TypeScript file's content and find all import paths using the parsed aliases.
 * 8. Generate new aliases based on the found import paths and update the `.quokka` file accordingly.
 *
 * @file Entry point for the Quokka TypeScript Path Alias extension.
 *
 * This module contains the main logic for the Quokka TypeScript Path Alias extension,
 * responsible for the following functionality:
 * - Activation of the extension
 * - Execution of the extension command
 * - Handling and updating of the import aliases
 * @module extension
 */

import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import {
  assertImportPathExists,
  createImportRegex,
  findImportPaths,
  getActiveFilePath,
  getTsConfig,
  getTsConfigPath,
  openQuokkaFile,
  parseTsConfigPaths,
} from './utils'

/**
 * Generate new aliases based on file content and TypeScript paths
 *
 * @param fileContent - The content of the file containing the imports.
 * @param tsPaths - TypeScript paths from the tsconfig.json file.
 * @returns New aliases.
 */
const generateNewAliases = (
  fileContent: string,
  tsPaths: [string, string[]][]
): Record<string, string> => {
  const newAliases = {} as Record<string, string>

  for (const tsPath of tsPaths) {
    const key = tsPath[0].replace('/*', '')
    const value = tsPath[1][0].replace('/*', '')

    const importRegex = createImportRegex(key)
    const importPaths = findImportPaths(fileContent, importRegex)

    for (const importPath of importPaths) {
      const newAlias = importPath.replace(key, value)
      if (assertImportPathExists(newAlias)) {
        newAliases[importPath] = importPath.replace(key, value)
      }
    }
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
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const quokkaConfig = JSON.parse(fs.readFileSync(quokkaPath, 'utf-8'))

  const tsPaths = parseTsConfigPaths(tsConfig)
  const newAliases = generateNewAliases(fileContent, tsPaths)
  updateQuokkaFile(quokkaPath, quokkaConfig, newAliases)
}

/**
 * Creates a .quokka file in the root directory, that includes the alias-quokka-plugin.
 *
 * @param quokkaPath - The path to the .quokka file.
 */
const createQuokkaFile = (quokkaPath: string): void => {
  fs.writeFileSync(
    quokkaPath,
    JSON.stringify(
      {
        plugins: ['alias-quokka-plugin'],
        alias: {},
      },
      null,
      2
    )
  )
}

/**
 * Checks if the provided path to the .quokka file exists and returns it.
 * If it doesn't exist, prompts the user to create one.
 *
 * @param quokkaPath - The path to the .quokka file.
 * @throws {Error} If the .quokka file is not found in the root directory and the user does not want to create one.
 */
const getQuokkaPath = async (): Promise<string> => {
  const baseDir = getBaseDir()
  const quokkaPath = path.join(baseDir, '.quokka')
  if (!fs.existsSync(quokkaPath)) {
    const selection = await vscode.window.showInformationMessage(
      'No .quokka file found in root directory. Would you like to create a .quokka file?',
      'Yes',
      'No'
    )

    if (selection === 'Yes') {
      createQuokkaFile(quokkaPath)
      const showFileSelection = await vscode.window.showInformationMessage(
        'Created .quokka file in root directory. Please run the command again.',
        'Show .quokka file',
        'Dismiss'
      )

      if (showFileSelection === 'Show .quokka file') {
        openQuokkaFile(quokkaPath)
      }
    }
    throw new Error('No .quokka file in root directory')
  }
  return quokkaPath
}

/**
 * The main function that is called when the extension is activated.
 * Registers the command to include aliases in the .quokka file.
 * @param context - The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'quokka-alias.include-aliases',
    async () => {
      try {
        const filePath = getActiveFilePath()
        const tsConfigPath = getTsConfigPath(filePath)
        updateQuokkaAliases(filePath, quokkaPath, tsConfig)
      } catch (error: any) {
        vscode.window.showErrorMessage(error.message)
      }
    }
  )

  context.subscriptions.push(disposable)
}
