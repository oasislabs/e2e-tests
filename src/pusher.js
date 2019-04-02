const parseArgs = require('minimist');
const promClient = require('prom-client');

// Parse command-line arguments.
const argv = parseArgs(process.argv.slice(2));
if (argv._.length !== 3) {
  console.error('Usage: pusher <push_gateway> <job_name> <result>');
  process.exit(1);
}
let gateway = argv._[0];
let name = argv._[1];
let result = argv._[2];

let pushGateway = new promClient.Pushgateway(gateway, { timeout: 5000 });

// Initialize error counter to 0.
const err = new promClient.Gauge({ name: 'e2e_tests_err', help: 'Error in e2e tests.' });
err.reset();

// If exit code was not 0, report an error.
if (result !== 0) {
  err.inc();
}

pushGateway.pushAdd({ jobName: `${name}`, groupings: 'ops-production' }, () => { process.exit(result); });
