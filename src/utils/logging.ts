import vscode from 'vscode'

export const outputChannel = vscode.window.createOutputChannel(
  'mattorp.quokka-alias'
)

export const log = (...args: any[] | any) => {
  const message = [args]
    .flat()
    .map(
      (arg) =>
        // Show message and stringified args
        `${arg.message ? '\n' + arg.message : ''}\n${JSON.stringify(arg)}`
    )
    .join('')
  console.log(message)
  outputChannel.appendLine(message)
  return args as typeof args
}
