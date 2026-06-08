const fs = require('fs');
const path = require('path');

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function cdata(value) {
  return String(value).replaceAll(']]>', ']]]]><![CDATA[>');
}

class SonarReporter {
  onRunComplete(_contexts, results) {
    const repoRoot = path.resolve(__dirname, '../..');
    const coverageDir = path.join(__dirname, 'coverage');
    const reportPath = path.join(coverageDir, 'sonar-test-report.xml');

    fs.mkdirSync(coverageDir, { recursive: true });

    const files = results.testResults
      .map((testResult) => {
        const filePath = path
          .relative(repoRoot, testResult.testFilePath)
          .split(path.sep)
          .join('/');
        const testCases = testResult.testResults
          .map((assertion) => {
            const name = escapeXml(assertion.fullName || assertion.title);
            const duration = Math.max(0, assertion.duration || 0);
            const messages = assertion.failureMessages || [];

            if (assertion.status === 'failed') {
              const message = escapeXml(messages[0] || 'Test failed');
              const details = cdata(messages.join('\n'));

              return `    <testCase name="${name}" duration="${duration}">\n      <failure message="${message}"><![CDATA[${details}]]></failure>\n    </testCase>`;
            }

            if (assertion.status === 'pending' || assertion.status === 'todo') {
              return `    <testCase name="${name}" duration="${duration}">\n      <skipped message="${assertion.status}"/>\n    </testCase>`;
            }

            return `    <testCase name="${name}" duration="${duration}"/>`;
          })
          .join('\n');

        return `  <file path="${escapeXml(filePath)}">\n${testCases}\n  </file>`;
      })
      .join('\n');

    fs.writeFileSync(
      reportPath,
      `<testExecutions version="1">\n${files}\n</testExecutions>\n`,
    );
  }
}

module.exports = SonarReporter;
