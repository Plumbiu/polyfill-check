import { EsFile, ModuleSupportMap } from './types'
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
  set: ModuleSupportMap,
  type: string,
  support: string,
) {
  const modules: string[] = []
  const addIfExist = (m: string) => {
    m = m.toLowerCase()
    if (set[m] && !IgnorePolyfill.has(m)) {
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
export function detectLog({
  ES,
  Other,
}: {
  ES: ModuleSupportMap
  Other: ModuleSupportMap
}) {
  const EsKeys = Object.keys(ES)
  const OtherKeys = Object.keys(Other)
  if (EsKeys.length === 0 || OtherKeys.length === 0) {
    return
  }

  newLine()
  const hasLogedSet = new Set<string>()
  for (let key of Object.keys(ES)) {
    const set = ES[key]
    if (/\d+/.test(key)) {
      key = `ES${key}`
    }
    if (key === 'ES2015') {
      key = 'ES6/ES2015'
    }
    console.log(pc.green(pc.bold(`${key}:`)))
    for (const pkg of [...set]) {
      const versions = Other[pkg]
      for (const v of versions) {
        console.log(`  ${pc.cyan(pkg)}@${v}`)
      }
      hasLogedSet.add(pkg)
    }
    newLine()
  }
  console.log(pc.green(pc.bold('Other:')))

  for (const pkg of OtherKeys) {
    if (hasLogedSet.has(pkg)) {
      continue
    }
    const versions = Other[pkg]
    for (const v of versions) {
      console.log(`  ${pc.cyan(pkg)}@${v}`)
    }
  }
  newLine()
}
