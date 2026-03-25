import { execSync } from 'child_process'
import * as path from 'path'

export default async function globalSetup() {
  const apiDir = path.resolve(__dirname, '..')
  execSync(
    'pnpm exec prisma migrate deploy --schema=./prisma/schema.prisma --config=./prisma.config.ts',
    { cwd: apiDir, stdio: 'inherit', env: { ...process.env } },
  )
}
