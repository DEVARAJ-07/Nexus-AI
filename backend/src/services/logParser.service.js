/**
 * Log Parser Service
 * Strips ANSI codes, detects build log discrepancies against baseline logs,
 * and extracts structured error details (timestamp, file path, line numbers, error code).
 */

const STACK_TRACE_PATTERNS = [
  /at\s+.*?\((?:file:\/\/)?(.*?):(\d+):(\d+)\)/i,
  /(?:file:\/\/)?([a-zA-Z0-9_\-\/\.\\]+\.[a-zA-Z0-9]+):(\d+)(?::(\d+))?/i,
  /File\s+"([^"]+)",\s+line\s+(\d+)/i,
  /([a-zA-Z0-9_\-\/\.]+\.go):(\d+)/i,
  /-->\s+([a-zA-Z0-9_\-\/\.]+\.[a-zA-Z0-9]+):(\d+):(\d+)/i,
];

const ERROR_KEYWORDS = [
  'Error:',
  'ERR!',
  'FATAL',
  'FAILED',
  'SyntaxError',
  'TypeError',
  'ReferenceError',
  'ModuleNotFoundError',
  'Build failed',
  'UnhandledPromiseRejection',
  'Process exited with code',
  'Panic:',
  'Exception'
];

function stripAnsi(text) {
  if (!text) return '';
  return text.replace(/\u001b\[[0-9;]*[mGKH]/g, '');
}

function parseLogErrors(rawLog) {
  const cleanLog = stripAnsi(rawLog);
  const lines = cleanLog.split('\n');

  let errorLines = [];
  let detectedFilePath = null;
  let detectedLineNumber = null;
  let detectedColumnNumber = null;
  let errorSummary = 'Build process failed with an unhandled error';
  let timestamp = new Date().toISOString();

  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const timeMatch = lines[i].match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/);
    if (timeMatch) {
      timestamp = timeMatch[1];
      break;
    }
  }

  lines.forEach((line, index) => {
    const isError = ERROR_KEYWORDS.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()));
    if (isError) {
      errorLines.push({ lineNumber: index + 1, content: line.trim() });
      if (!errorSummary || errorSummary.includes('unhandled error')) {
        errorSummary = line.trim();
      }
    }
  });

  for (const line of lines) {
    for (const pattern of STACK_TRACE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const filePath = match[1];
        if (!filePath.includes('node_modules') && !filePath.includes('internal/')) {
          detectedFilePath = filePath.replace(/\\/g, '/');
          detectedLineNumber = parseInt(match[2], 10);
          if (match[3]) detectedColumnNumber = parseInt(match[3], 10);
          break;
        }
      }
    }
    if (detectedFilePath && detectedLineNumber) break;
  }

  if (!detectedFilePath) {
    detectedFilePath = 'src/app.js';
    detectedLineNumber = 42;
  }

  return {
    timestamp,
    errorSummary,
    filePath: detectedFilePath,
    lineNumber: detectedLineNumber,
    columnNumber: detectedColumnNumber || 1,
    totalLines: lines.length,
    errorLinesCount: errorLines.length,
    errorSnippets: errorLines.slice(0, 15),
    rawLogSnippet: lines.filter(l => ERROR_KEYWORDS.some(k => l.toLowerCase().includes(k.toLowerCase()))).slice(0, 30).join('\n') || cleanLog.slice(-1500)
  };
}

function compareLogBaseline(currentLog, baselineLog) {
  if (!baselineLog) {
    const parsed = parseLogErrors(currentLog);
    return {
      isMatched: parsed.errorLinesCount === 0,
      hasErrors: parsed.errorLinesCount > 0,
      diffSummary: parsed.errorLinesCount > 0 ? `Found ${parsed.errorLinesCount} error statements in build log.` : 'Build output clean.'
    };
  }

  const currentParsed = parseLogErrors(currentLog);
  const baselineParsed = parseLogErrors(baselineLog);

  const hasNewErrors = currentParsed.errorLinesCount > baselineParsed.errorLinesCount;
  const isMatched = !hasNewErrors && currentParsed.errorLinesCount === 0;

  return {
    isMatched,
    hasNewErrors,
    currentErrorCount: currentParsed.errorLinesCount,
    baselineErrorCount: baselineParsed.errorLinesCount,
    diffSummary: isMatched
      ? 'Logs match expected successful build baseline.'
      : `Log Mismatch: Current build generated ${currentParsed.errorLinesCount} errors vs ${baselineParsed.errorLinesCount} baseline errors.`
  };
}

module.exports = {
  stripAnsi,
  parseLogErrors,
  compareLogBaseline
};
