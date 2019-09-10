const truffleConfig = require('../truffle-config');
const oasis = require('@oasislabs/client');
const utils = require('../src/utils');

const DUMMY_API_TOKEN = 'YkbtcR1EWsC8JV0HzTB3KHGUXA0kGox2l4qTZT05rrg=';
// ^ This is generated from 32 random bytes. It may need to be updated once the dev gateway
//   uses API tokens.

if (truffleConfig.shouldRun(__filename)) {
  contract('Oasis client', async (accounts) => {
    const services = [
      {
        idl: undefined,
        bytecode: oasis.workspace.MantleCounter.bytecode,
        coder: undefined,
        label: 'mantle'
      }
    ];
    const gateways = [
      {
        gateway: new oasis.gateways.Web3Gateway(
          utils.wsProviderUrl(),
          new oasis.Wallet(truffleConfig.OASIS_CLIENT_SK)
        ),
        completion: test => test.gateway.disconnect(),
        options: { gasLimit: '0xe79732' },
        label: 'web3-gw'
      },
      {
        gateway: new oasis.gateways.Gateway(truffleConfig.DEVELOPER_GATEWAY_URL, DUMMY_API_TOKEN, {
          headers: new Map([['X-OASIS-INSECURE-AUTH', 'VALUE']])
        }),
        completion: _test => {},
        options: undefined,
        label: 'dev-gw'
      }
    ];
    const headers = [
      {
        header: { confidential: false },
        label: 'non-confidential'
      },
      {
        header: { confidential: true },
        label: 'confidential'
      }
    ];
    gateways.forEach(gatewayConfig => {
      services.forEach(serviceConfig => {
        headers.forEach(headerConfig => {
          let prefix = `${serviceConfig.label}/${gatewayConfig.label}/${headerConfig.label}`;
          let service;

          it(`${prefix}: sets the default gateway`, () => {
            oasis.setGateway(gatewayConfig.gateway);
          });

          it(`${prefix}: deploys a service`, async () => {
            service = await oasis.deploy({
              idl: serviceConfig.idl,
              bytecode: serviceConfig.bytecode,
              header: headerConfig.header,
              coder: serviceConfig.coder
            });
          });

          it(`${prefix}: executes an rpc`, async () => {
            let beforeCount = await service.getCounter(gatewayConfig.options);
            await service.incrementCounter(gatewayConfig.options);
            let afterCount = await service.getCounter(gatewayConfig.options);
            await service.setCounter(6, gatewayConfig.options);
            let afterSetCount = await service.getCounter(gatewayConfig.options);
            await service.setCounter2(10, 9, gatewayConfig.options);
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
                await service.incrementCounter(gatewayConfig.options);
              }
            });

            for (let k = 1; k < logs.length; k += 1) {
              // Depending upon the gateway's view, we might get the log for the previous test,
              // so just ensure the logs received are monotonically increasing.
              let currentCounter = logs[k].newCounter;
              let lastCounter = logs[k - 1].newCounter;
              // Solidity coder uses big numbers.
              if (serviceConfig.label === 'solidity') {
                currentCounter = currentCounter.toNumber();
                lastCounter = lastCounter.toNumber();
              }
              assert.equal(currentCounter - lastCounter, 1);
            }
          });
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
