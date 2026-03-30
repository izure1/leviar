import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

/** 라이브러리 번들 설정 */
const libOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: /** @type {'esm'} */ ('esm'),
  outfile: 'dist/lve4.js',
  sourcemap: true,
  target: 'esnext',
  platform: 'browser',
}

/** 예제 페이지 번들 설정 */
const exampleOptions = {
  entryPoints: ['example/main.ts'],
  bundle: true,
  format: /** @type {'esm'} */ ('esm'),
  outfile: 'example/main.js',
  sourcemap: true,
  target: 'esnext',
  platform: 'browser',
}

if (watch) {
  // dev 서버 모드: 예제 번들을 빌드하고 정적 파일 서버 실행
  const ctx = await esbuild.context(exampleOptions)
  await ctx.watch()

  const { port } = await ctx.serve({
    servedir: 'example',
    port: 3000,
  })

  console.log(`[lve4] dev server: http://localhost:${port}`)
} else {
  // 프로덕션 빌드: 라이브러리만 번들
  const result = await esbuild.build(libOptions)
  if (result.errors.length > 0) {
    console.error('[lve4] build failed')
    process.exit(1)
  }
  console.log('[lve4] build complete -> dist/lve4.js')
}
