module.exports = require('@aragon/truffle-config-v5')

module.exports.networks.rpc.port = 8545

const {MNEMONIC, NETWORK} = process.env;
const HDWalletProvider = require('truffle-hdwallet-provider')
module.exports.networks.mnemonic = {
    provider: () => new HDWalletProvider(MNEMONIC, `https://${NETWORK}.infura.io/v3/87ad6d66780443868a9ab0a1f624a43a`),
    network_id: '*',
    gas: 6500000,           // Default gas to send per transaction
    gasPrice: 1000000000,  // 10 gwei (default: 20 gwei)
    confirmations: 0,       // # of confs to wait between deployments. (default: 0)
    timeoutBlocks: 200,     // # of blocks before a deployment times out  (minimum/default: 50)
    skipDryRun: false        // Skip dry run before migrations? (default: false for public nets )
}
