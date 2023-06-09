import fs from 'fs'
import vscode from 'vscode'
import { openQuokkaFile } from '.'

/**
 * Get the path to the .quokka file
 *
 * @param quokkaPath - The path to the .quokka file.
 * @returns The path to the .quokka file relative to the workspace root.
 */
export const getPathToQuokkaFile = (quokkaPath: string) =>
  // remove anything between the workspace root and the .quokka file
  // example: /Users/username/repo/dir/dir2/.quokka -> dir/dir2
  // example: /Users/username/repo/dir/.quokka -> dir
  // example: /Users/username/repo/.quokka -> ''
  quokkaPath
    .replace(vscode.workspace.workspaceFolders![0].uri.fsPath, '')
    .replace('.quokka', '')

/**
 * Creates a .quokka file that contains the alias-quokka-plugin and an empty alias object.
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
export const assertQuokkaFileExists = async (
  filepath: string
): Promise<true> => {
  if (fs.existsSync(filepath)) {
    return true
  }

  const selection = await vscode.window.showInformationMessage(
    'No .quokka file found in same directory as the nearest tsconfig.json file. Would you like to create a .quokka file?',
    'Yes',
    'No'
  )

  if (selection === 'Yes') {
    createQuokkaFile(filepath)
    const showFileSelection = await vscode.window.showInformationMessage(
      'Created .quokka file in same directory as the nearest tsconfig.json file. Please run the command again.',
      'Show .quokka file',
      'Dismiss'
    )

    if (showFileSelection === 'Show .quokka file') {
      openQuokkaFile(filepath)
    }
  }
  throw new Error('No .quokka file found higher up in the directory tree.')
}

/**
 * File extensions to be checked.
 */
const EXTS = ['.ts', '.js']

/**
 * Checks if a file exists including the given path suffixes and extensions.
 *
 * @param {string} filePath - The path of the file to check.
 * @returns {false | string} - The full path of the file if it exists, false otherwise.
 */
export const assertFileExists = (
  filePath: string,
  {
    pathSuffixes = ['', '/index'],
    extensions = EXTS,
  }: {
    pathSuffixes?: string[]
    extensions?: string[]
  } = {}
): false | string => {
  for (const suffix of pathSuffixes) {
    for (const ext of extensions) {
      const fullPath = filePath + suffix + ext
      if (fs.existsSync(fullPath)) {
        return fullPath
      }
    }
  }
  return false
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
