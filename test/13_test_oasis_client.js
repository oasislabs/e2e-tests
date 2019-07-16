const Counter = artifacts.require('Counter');
const truffleConfig = require('../truffle-config');
const oasis = require('@oasislabs/client');
const utils = require('../src/utils');

if (truffleConfig.shouldRun(__filename)) {
  console.log('Running test', __filename);
  contract('Oasis client', async (accounts) => {
    console.log('runniing test with accounts', accounts);
    const services = [
      {
        idl: Counter.abi,
        bytecode: Counter.bytecode,
        coder: new oasis.utils.EthereumCoder(),
        label: 'solidity'
      },
      {
        idl: undefined,
        bytecode: require('fs').readFileSync(
          '/workdir/tests/e2e-tests/mantle/mantle-counter/target/service/mantle-counter.wasm'
        ),
        coder: undefined,
        label: 'mantle'
      }
    ];
    console.log('services = ', services);
    const gateways = [
      {
        gateway: new oasis.gateways.Web3Gateway(
          utils.wsProviderUrl(),
          oasis.Wallet.fromMnemonic(truffleConfig.MNEMONIC)
        ),
        completion: test => test.gateway.disconnect(),
        options: { gasLimit: '0xf00000' },
        label: 'web3-gw'
      }
      /*
      {
        gateway: new oasis.gateways.DeveloperGateway(truffleConfig.DEVELOPER_GATEWAY_URL),
        completion: _test => {},
        options: undefined,
        label: 'dev-gw',
      }
      */
    ];
    console.log('gateways = ', gateways);
    const headers = [
      {
        header: { confidential: true },
        label: 'confidential'
      },
      {
        header: { confidential: false },
        label: 'non-confidential'
      }
    ];
    console.log('headers = ', headers);
    console.log('now here');
    services.forEach(serviceConfig => {
      gateways.forEach(gatewayConfig => {
        headers.forEach(headerConfig => {
          // We don't support confidential solidity.
          if (!headerConfig.header.confidential || serviceConfig.label !== 'solidity') {

            let prefix = `${serviceConfig.label}/${gatewayConfig.label}/${headerConfig.label}`;
            let service;

            it(`${prefix}: sets the default gateway`, () => {
              oasis.setGateway(gatewayConfig.gateway);
            });

            it(`${prefix}: deploys a service`, async () => {
              service = await oasis.deploy({
                idl: serviceConfig.idl,
                bytecode: serviceConfig.bytecode,
                arguments: [],
                header: headerConfig.header,
                coder: serviceConfig.coder
              });
            });

            it(`${prefix}: executes an rpc`, async () => {
              let beforeCount = await service.getCounter(gatewayConfig.options);
              let result = await service.incrementCounter(gatewayConfig.options);
              let afterCount = await service.getCounter(gatewayConfig.options);
              let setResult = await service.setCounter(6, gatewayConfig.options);
              let afterSetCount = await service.getCounter(gatewayConfig.options);
              let setResult2 = await service.setCounter2(10, 9, gatewayConfig.options);
              let afterSetCount2 = await service.getCounter(gatewayConfig.options);

              assert.equal(beforeCount, 0);
              assert.equal(afterCount, 1);
              assert.equal(afterSetCount, 6);
              assert.equal(afterSetCount2, 9);
            });

            it(`${prefix}: listens for three service events`, async () => {
              let logs = await new Promise(async resolve => {
                let logs = [];
                service.addEventListener('Incremented', function listener (event) {
                  logs.push(event);
                  if (logs.length === 3) {
                    service.removeEventListener('Incremented', listener);
                    resolve(logs);
                  }
                });
                for (let k = 0; k < 3; k += 1) {
                  await service.incrementCounter();
                }
              });

              for (let k = 1; k < logs.length; k += 1) {
                // Depending upon the gateway's view, we might get the log for the previous test,
                // so just ensure the logs received are monotonically increasing.
                let currentCounter = logs[k].newCounter;
                let lastCounter = logs[k-1].newCounter;
                // Solidity coder uses big numbers.
                if (serviceConfig.label === 'solidity') {
                  currentCounter = currentCounter.toNumber();
                  lastCounter = lastCounter.toNumber();
                }
                assert.equal(currentCounter - lastCounter, 1);
              }
            });
          }
        });
      });
    });

    it('cleans up', () => {
      gateways.forEach(gatewayConfig => {
        gatewayConfig.completion(gatewayConfig);
      });
    });
  });
}
