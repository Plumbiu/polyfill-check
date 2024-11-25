import path from 'node:path'
import fs from 'node:fs'
import ts from 'typescript'
import * as fg from 'fast-glob'

function getAst(filePath: string) {
  const text = fs.readFileSync(filePath, 'utf-8')
  const ast = ts.createSourceFile('ast.ts', text, ts.ScriptTarget.Latest, false)
  return ast
}

function getSupports(ast: ts.SourceFile, type: string, searchType?: string) {
  type = searchType ? searchType : type
  const supports: string[] = []
  ts.visitNode(ast, (node) => {
    const statements = node.statements
    for (const state of statements) {
      if (ts.isInterfaceDeclaration(state)) {
        if (state.name.escapedText === type) {
          for (const member of state.members) {
            if (
              'name' in member &&
              member.name &&
              'escapedText' in member.name
            ) {
              const methodName = member.name.escapedText
              if (methodName && methodName !== 'prototype') {
                supports.push(methodName)
              }
            }
          }
        }
      }

      if (ts.isModuleDeclaration(state)) {
        const name = state.name
        if (name && 'escapedText' in name && name.escapedText === type) {
          const body = state.body
          if (body && ts.isModuleBlock(body)) {
            const statements = body.statements
            for (const statement of statements) {
              if (
                ts.isFunctionDeclaration(statement) ||
                ts.isInterfaceDeclaration(statement) ||
                ts.isTypeAliasDeclaration(statement)
              ) {
                const methodName = statement.name?.escapedText
                if (methodName && methodName !== 'prototype') {
                  supports.push(methodName)
                }
              }
            }
          }
        }
      }
    }

    return node
  })
  return supports
}

const Types = [
  // key, seartchType
  ['Object'],
  ['Array'],
  // ['Map'], // map haven't updated after es2015
  // ['WeakMap'],
  ['Set'],
  // ['WeakSet'],
  ['Generator'],
  ['Date'],
  ['RegExp'],
  ['Boolean'],
  ['Math'],
  ['BigInt'],
  ['Function'],
  ['String'],
  ['Number'],
  ['Promise'],
  ['Symbol'],
  ['ArrayBuffer'],
  ['Reflect'],
  ['Proxy', 'ProxyHandler'],
  ['Intl'],
] as const

const VersionRegx = /lib\.es(\d+|next).*/

function format(_key: string, value: any) {
  if (value instanceof Set) {
    if (value.size === 0) {
      return undefined
    }
    return [...value]
  }

  return value
}

function isEmptyObject(obj: Object) {
  return Object.keys(obj).length === 0
}

type Result = Record<string, Record<string, Set<string>>>
function run() {
  const cwd = 'node_modules/typescript/lib'
  const files = fg.globSync('lib.es*.d.ts', {
    dot: true,
    cwd,
  })
  const instance: Result = {}
  const prototype: Result = {}

  function make(obj: Result, type: string, v: string) {
    if (!obj[type]) {
      obj[type] = {}
    }
    if (!obj[type][v]) {
      obj[type][v] = new Set()
    }
  }

  files.forEach((file) => {
    const ast = getAst(path.join(cwd, file))
    const [_, v] = VersionRegx.exec(file) ?? []
    // es6 is equal to es2015
    if (v) {
      Types.forEach((item) => {
        let [type, searchType] = item
        const instanceSupports = getSupports(ast, type, searchType)
        const constructorSupports = getSupports(ast, type + 'Constructor')
        if (instanceSupports.length > 0) {
          make(instance, type, v)
          for (const s of instanceSupports) {
            instance[type][v].add(s)
          }
        }
        if (constructorSupports.length > 0) {
          make(prototype, type, v)
          for (const s of constructorSupports) {
            prototype[type][v].add(s)
          }
        }
      })
    }
  })

  fs.writeFileSync('./src/es-instance.json', JSON.stringify(instance, format))
  fs.writeFileSync(
    './src/es-constructor.json',
    JSON.stringify(prototype, format),
  )
}

run()
