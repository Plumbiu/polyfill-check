import fsp from 'node:fs/promises'
import fs from 'node:fs'
import { EsFile, ModuleSupportSet } from './types'
import { traverseEsFile, guessHasModule } from './utils'
import es_constructor from './es-constructor.json'
import es_instance from './es-instance.json'
import path from 'node:path'
import { IgnorePolyfill, ManualPolyfill } from './manual'

const esConstructor = es_constructor as unknown as EsFile
const esInstance = es_instance as unknown as EsFile

export async function tryReadFileWithJson(p: string) {
  try {
    const json = await fsp.readFile(p, 'utf-8')
    return JSON.parse(json)
  } catch (error) {
    return { keywords: [] }
  }
}

export async function getPolyfillFromNodemodules() {
  const modules: Set<string> = new Set()
  const { keywords, name } = (await tryReadFileWithJson('package.json')) ?? {}
  if (
    name &&
    keywords &&
    (keywords.includes('polyfill') || keywords.includes('shim'))
  ) {
    modules.add(name.toLowerCase())
  }
  async function readGlob(p: string) {
    const dirs = await fsp.readdir(p, { withFileTypes: true })
    await Promise.all(
      dirs.map(async (dir) => {
        const pkgPath = path.join(p, dir.name)
        if (dir.name === '.bin' || dir.isFile()) {
          return
        }
        const filePath = path.join(pkgPath, 'package.json')
        if (fs.existsSync(filePath)) {
          const { keywords, name } = (await tryReadFileWithJson(filePath)) ?? {}
          if (
            name &&
            keywords &&
            (keywords.includes('polyfill') || keywords.includes('shim'))
          ) {
            modules.add(name.toLowerCase())
          }
        } else {
          await readGlob(pkgPath)
        }
      }),
    )
  }
  await readGlob('node_modules')
  return modules
}

export async function getPolyfillPkgs() {
  const modules: ModuleSupportSet = {}
  const polyfills = await getPolyfillFromNodemodules()
  IgnorePolyfill.forEach((value) => {
    polyfills.delete(value)
  })
  function addModule(version: string, value: string) {
    if (!modules[version]) {
      modules[version] = new Set()
    }
    modules[version].add(value)
    polyfills.delete(value)
  }

  ManualPolyfill.forEach((value) => {
    if (polyfills.has(value)) {
      addModule('Other', value)
    }
  })

  traverseEsFile(esConstructor, (type, version, support) => {
    const guessResult = guessHasModule(polyfills, type, support)
    if (guessResult.has) {
      for (const value of guessResult.modules) {
        addModule(version, value)
      }
    }
  })

  traverseEsFile(esInstance, (type, version, support) => {
    const guessResult = guessHasModule(polyfills, type, support)
    if (guessResult.has) {
      for (const value of guessResult.modules) {
        addModule(version, value)
      }
    }
  })

  return { Other: polyfills, ...modules }
}
