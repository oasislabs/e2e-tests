use oasis_std::prelude::*;

#[contract]
trait BulkStorage {
    fn constructor(&mut self) {}

    fn set_bulk_storage(&mut self, storage_key: H256, storage_value: Vec<u8>) {
        set_bytes(&storage_key, &storage_value);
    }

    fn get_bulk_storage(&mut self, storage_key: H256) -> Vec<u8> {
        get_bytes(&storage_key).unwrap()
    }

    fn set_h256_storage(&mut self, key: H256, value: U256) {
        write(&key, &value.into());
    }

    fn read_h256_storage(&mut self, key: H256) -> [u8; 32] {
        read(&key)
    }
}
