import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const tsdownBin = path.resolve(rootDir, '../acp-quota-dashboard/node_modules/.bin/tsdown')

console.log('Building client bundle with tsdown...')
execSync(`${tsdownBin}`, { cwd: rootDir, stdio: 'inherit' })
console.log('Client build complete.')
