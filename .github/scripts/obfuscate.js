// 混淆入口，由 GitHub Actions 调用。产物落到 dist/，不写回仓库。
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const SOURCE_NAME = '明文源吗';
const OUT_DIR = 'dist';
const OUT_FILE = path.join(OUT_DIR, 'worker.js');

const sourcePath = path.join(process.cwd(), SOURCE_NAME);
if (!fs.existsSync(sourcePath)) {
  console.error(`错误：未找到源文件 ${sourcePath}`);
  process.exit(1);
}

const originalCode = fs.readFileSync(sourcePath, 'utf8');
if (!originalCode.trim()) {
  console.error(`错误：源文件 ${SOURCE_NAME} 为空。`);
  process.exit(1);
}

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: false,
  controlFlowFlatteningThreshold: 0,
  deadCodeInjection: false,

  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 1.0,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: false,
  stringArrayWrappersParametersMaxCount: 3,

  // 改为 false：Worker 入口通常是 `export default { fetch }`，
  // 顶层声明的重命名在这种模块形态下收益很小、翻车风险不小。
  renameGlobals: false,
  identifierNamesGenerator: 'mangled-shuffled',
  identifiersPrefix: '',
  renameProperties: false,

  target: 'browser',
  numbersToExpressions: false,
  simplify: false,

  // 原来是 1（逐字符切分），产物体积会翻好几倍。4~6 观感几乎一样，体积腰斩。
  splitStrings: true,
  splitStringsChunkLength: 5,

  transformObjectKeys: false,
  unicodeEscapeSequence: true,
  selfDefending: false,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,
  domainLock: []

  // 注意：不设 seed，每次混淆结果都不同。
  // 因为产物不再进 git，随机不影响仓库；如果你想要「源没变就跳过部署」，
  // 把 seed 设成固定值（如 seed: 12345），输出即可确定性复现。
};

const obfuscatedCode = JavaScriptObfuscator
  .obfuscate(originalCode, obfuscationOptions)
  .getObfuscatedCode();

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, obfuscatedCode, 'utf8');

console.log(
  `OK: ${SOURCE_NAME} -> ${OUT_FILE} ` +
  `(${originalCode.length} -> ${obfuscatedCode.length} bytes)`
);
