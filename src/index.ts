import { cac } from 'cac'
import { version as depVersion, name } from '../package.json'
import { detectLog } from './utils'
import { getPolyfillPkgs } from './core'

const cli = cac(name)

cli.command('', 'check polyfill deps').action(async () => {
  const modules = await getPolyfillPkgs()
  detectLog(modules)
})

cli.version(depVersion)
cli.help()
cli.parse()
