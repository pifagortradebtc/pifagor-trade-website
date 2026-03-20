/**
 * Экспорт аналитики в Excel и открытие файла.
 * Использует тв.xlsx из Downloads или analytics.jsonl.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');
const excelPath = path.join(projectRoot, 'analytics-report.xlsx');
const downloadsExcel = path.join(process.env.USERPROFILE || '', 'Downloads', 'тв.xlsx');

let source = '';
if (fs.existsSync(downloadsExcel)) {
  source = `"${downloadsExcel}"`;
}

try {
  execSync(`python scripts/export-analytics-to-excel.py ${source}`, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  if (fs.existsSync(excelPath)) {
    execSync(`start "" "${excelPath}"`, { shell: true });
    console.log('Отчёт открыт.');
  }
} catch (e) {
  console.error('Ошибка:', e.message);
  process.exit(1);
}
