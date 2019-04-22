const parseArgs = require('minimist');
const promClient = require('prom-client');

/**
 * Reports the result of running end-to-end tests to a Prometheus pushgateway.
 * Will only work in cluster (staging or prod).
 */

// Parse command-line arguments.
const argv = parseArgs(process.argv.slice(2));
if (argv._.length !== 3) {
  console.error('Usage: report_result <pushgateway> <job_name> <exit_code>');
  process.exit(1);
}
let gateway = argv._[0];
let name = argv._[1];
let exitCode = argv._[2];

let pushgateway = new promClient.Pushgateway(gateway, { timeout: 5000 });

// Initialize error counter to 0.
const err = new promClient.Gauge({ name: 'e2e_tests_err', help: 'Error in e2e tests.' });
err.reset();

// If exit code was not 0, report an error.
if (exitCode !== 0) {
  err.inc();
}

pushgateway.pushAdd({ jobName: `${name}`, groupings: { instance: 'ops-production' } }, () => { process.exit(exitCode); });
