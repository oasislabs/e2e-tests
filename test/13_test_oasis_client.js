const Counter = artifacts.require('Counter');
const truffleConfig = require('../truffle-config');
const oasis = require('client');
const utils = require('../src/utils');

if (truffleConfig.shouldRun(__filename)) {
  contract('Oasis client', async (accounts) => {
    let service;

    const gateways = [
      {
        gateway: new oasis.gateways.Web3Gateway(
          utils.wsProviderUrl(),
          oasis.Wallet.fromMnemonic(truffleConfig.MNEMONIC)
        ),
        completion: test => test.gateway.disconnect(),
        options: { gasLimit: '0xf00000' }
      }/*,
      {
        gateway: oasis.gateways.DeveloperGateway.http(truffleConfig.DEVELOPER_GATEWAY_URL),
        completion: _test => {},
        options: undefined
      }
	  */
    ];

    gateways.forEach(test => {
      it('deploys a non-confidential ethereum service', async () => {
        let coder = new oasis.utils.EthereumCoder();

        service = await oasis.deploy({
          idl: Counter.abi,
          bytecode: Counter.bytecode,
          arguments: [],
          header: { confidential: false },
          coder,
          gateway: test.gateway
        });
      });

      it('executes an rpc', async () => {
        let beforeCount = await service.getCounter(test.options);
        await service.incrementCounter(test.options);
        let afterCount = await service.getCounter(test.options);

        assert.equal(beforeCount.toNumber(), 0);
        assert.equal(afterCount.toNumber(), 1);
      });

      it(`listens for three service events`, async () => {
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
          assert.equal(logs[k].newCounter.toNumber() - logs[k - 1].newCounter.toNumber(), 1);
        }

        test.completion(test);
      });
    });
  });
}
