export type ESVersionKey =
  | '5'
  | '2015'
  | '2016'
  | '2017'
  | '2018'
  | '2019'
  | '2020'
  | '2021'
  | '2022'
  | '2023'
  | '2024'

export type ModuleSupportMap = Record<string, Set<string>>

export type EsFile = Record<string, Record<string, string[]>>

