// Strip --cwd and its value from argv (added by Claude preview tool), then run next
process.argv = process.argv.filter((a, i, arr) => {
  if (a === '--cwd') return false;
  if (arr[i - 1] === '--cwd') return false;
  return true;
});
process.chdir(__dirname);
require('./node_modules/next/dist/bin/next');
