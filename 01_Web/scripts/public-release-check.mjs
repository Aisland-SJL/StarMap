import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { sourceRoot } from './private-profile.mjs'

const execFileAsync = promisify(execFile)
const npmExecPath = process.env.npm_execpath

async function run(command, args, cwd) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      maxBuffer: 16 * 1024 * 1024,
    })
    if (stdout) process.stdout.write(stdout)
    if (stderr) process.stderr.write(stderr)
  } catch (error) {
    throw new Error(`Failed to run ${command} ${args.join(' ')}: ${error.message}`, { cause: error })
  }
}

async function runNpm(args, cwd) {
  if (npmExecPath) return run(process.execPath, [npmExecPath, ...args], cwd)
  return run(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, cwd)
}

async function main() {
  const { stdout: status } = await execFileAsync('git', ['status', '--porcelain'], { cwd: sourceRoot })
  if (status.trim()) {
    throw new Error('公共发布检查要求 01_source 工作区完全干净。请先检查并提交本地修改。')
  }

  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'starmap-public-release-'))
  const archivePath = path.join(temporaryRoot, 'source.tar')
  const checkoutRoot = path.join(temporaryRoot, 'checkout')
  const checkoutWebRoot = path.join(checkoutRoot, '01_Web')

  try {
    await mkdir(checkoutRoot, { recursive: true })
    await run('git', ['archive', '--format=tar', 'HEAD', '-o', archivePath], sourceRoot)
    await run('tar', ['-xf', archivePath, '-C', checkoutRoot], sourceRoot)
    await runNpm(['ci', '--no-audit', '--no-fund'], checkoutWebRoot)
    await runNpm(['run', 'lint'], checkoutWebRoot)
    await runNpm(['run', 'build:public'], checkoutWebRoot)
    console.log('StarMap clean-room public release check passed.')
    console.log('The build used only files tracked by Git; 06_private was not available to the build.')
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
