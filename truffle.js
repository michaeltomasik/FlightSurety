var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "thunder outside way expose wood outside hat invest atom air adult caught";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '*',
      gas: 6721975, //from ganache-cli output
      gasPrice: 20000000000, //From ganache-cli output
    }
  },
  compilers: {
    solc: {
      version: "0.5.0",
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 1000 // Default: 200
        },
      },
    },
  }
}