const BulkStorage = artifacts.require('BulkStorage');
const Web3c = require('web3c');
const web3c = new Web3c(BulkStorage.web3.currentProvider);

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('BulkStorage', (accounts) => {
    // Run the tests against both a confidential and non confidential contract.
    let contracts = [
      {
        storage: new web3c.eth.Contract(BulkStorage.abi, undefined, {
          from: accounts[0]
        }),
        label: 'eth'
      },
      {
        storage: new web3c.confidential.Contract(BulkStorage.abi, undefined, {
          from: accounts[0]
        }),
        label: 'confidential'
      }
    ];

    contracts.forEach((contract) => {
      let tests = [
        {
          key: '0x0000000000000000000000000000000100000000000000000000000000000000',
          value: '0x01020304',
          description: 'less than 256 bits'
        },
        {
          key: '0x0000000000000000000000000000000100000000000000000000000000000001',
          value: '0x1000000000000000000000000000000100000000000000000000000000000001',
          description: 'equal to 256 bits'
        },
        {
          key: '0x0000000000000000000000000000000100000000000000000000000000000002',
          value: '0x100000000000000000000000000000010000000000000000000000000000000101',
          description: 'greater than 256 bits'
        },
        {
          key: '0x0000000000000000000000000000000100000000000000000000000000000003',
          value: '0x1000000000000000000000000000000100000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000001000000000000000000000000000000010111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000010000000000000000000000000000000101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000100000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000001000000000000000000000000000000010111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000010000000000000000000000000000000101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000100000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000001000000000000000000000000000000010111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111',
          description: 'significantly greater than 256 bits'
        }
      ];

      // The deployed contract instance to use in all the subsequent tests.
      let instance;

      it(`${contract.label}: deploys a bulk storage contract`, async () => {
        instance = await contract.storage.deploy({ data: BulkStorage.bytecode }).send({
          from: accounts[0]
        });
        assert.equal(instance.options.address.length, 42);
      });

      tests.forEach((test) => {
        it(`${contract.label}: stores data ${test.description} with the set_bytes interface`, async () => {
          let receipt = await instance.methods.set_bulk_storage(test.key, test.value).send();
          assert.equal(receipt.status, true);
        });

        it(`${contract.label}: retrieves data ${test.description} with the get_bytes interface`, async () => {
          let storage = await instance.methods.get_bulk_storage(test.key).call();
          assert.equal(test.value, storage);
        });

        it(`${contract.label}: retrieves H256::zero() when reading the same key (from previously set bulk storage with data ${test.description}) from the owasm_ethereum::read interface`, async () => {
          let storage = await instance.methods.read_h256_storage(test.key).call();
          assert.equal(storage, 0);
        });

        it(`${contract.label}: writes two different non-conflicting values when writing to bulk storage and the H256 interface`, async () => {
          let receipt = await instance.methods.set_h256_storage(test.key, test.key).send();
          assert.equal(receipt.status, true);

          let storage = await instance.methods.read_h256_storage(test.key).call();
          let bulkStorage = await instance.methods.get_bulk_storage(test.key).call();

          assert.equal(storage, test.key);
          assert.equal(bulkStorage, test.value);
        });
      });

      it(`${contract.label}: retrieves an empty bulk storage for storage that has never been set`, async () => {
        let key = [
          1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
        ];
        let storage = await instance.methods.get_bulk_storage(key).call();
        assert.equal(storage, null);
      });
    });
  });
}
