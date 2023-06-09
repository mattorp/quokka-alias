import vscode from 'vscode'
import { includeAliases } from './includeAliases'

/**
 * The main function that is called when the extension is activated.
 * Registers the command to include aliases in the .quokka file.
 * @param context - The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'quokka-alias.include-aliases',
    includeAliases
  )

  context.subscriptions.push(disposable)
}
