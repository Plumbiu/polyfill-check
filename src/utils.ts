import { EsFile, ModuleSupportSet } from './types'
import pc from 'picocolors'
import { IgnorePolyfill } from './manual'

function toSnakeKey(s: string) {
  let str = s[0]
  for (const ch of s.slice(1)) {
    if (/[A-Z]/.test(ch)) {
      str += '-'
    }
    str += ch
  }
  return str
}

export function guessHasModule(
  set: Set<string>,
  type: string,
  support: string,
) {
  const modules: string[] = []
  const addIfExist = (m: string) => {
    m = m.toLowerCase()
    if (set.has(m) && !IgnorePolyfill.has(m)) {
      modules.push(m)
    }
  }
  // object.keys, object-keys, object.prototype.keys
  addIfExist(`${type}.${support}`)
  addIfExist(`${type}-${support}`)
  addIfExist(`${type}.prototype.${support}`)
  addIfExist(`${toSnakeKey(type)}-${toSnakeKey(support)}`)
  return {
    has: !!modules.length,
    modules,
  }
}

export function traverseEsFile(
  file: EsFile,
  cb: (type: string, version: string, support: string) => void,
) {
  for (const type in file) {
    const typeObj = file[type]
    for (const version in typeObj) {
      const supports = typeObj[version]
      if (supports.length === 0) {
        continue
      }
      for (const support of supports) {
        cb(type, version, support)
      }
    }
  }
}

export function newLine() {
  console.log()
}
export function detectLog(modules: ModuleSupportSet) {
  const moduleKeys = Object.keys(modules)
  if (moduleKeys.length === 0) {
    return
  }

  newLine()
  for (let key of Object.keys(modules)) {
    const set = modules[key]
    if (/\d+/.test(key)) {
      key = `ES${key}`
    }
    if (key === 'ES2015') {
      key = 'ES6/ES2015'
    }
    console.log(pc.green(pc.bold(`${key}:`)))
    for (const pkg of [...set]) {
      console.log(`  ${pc.cyan(pkg)}`)
    }
    newLine()
  }
}
