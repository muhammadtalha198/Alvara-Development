require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");

require("hardhat-deploy");
require("dotenv/config");

/** @type import('hardhat/config').HardhatUserConfig */

const RPC_ENDPOINT_SEPOLIA_NETWORK = process.env.RPC_URL_SEPOLIA_NETWORK;
const PRIVATE_KEY_ACCOUNT_SEPOLIA = process.env.PRIVATE_KEY_SEPOLIA_NETWORK;
const API_KEY_ETHERSCAN = process.env.ETHERSCAN_API_KEY;
const API_KEY_COINMARKET_CAP = process.env.COIN_MARKET_CAP_API_KEY;

// Mainnet
const PRIVATE_KEY_ALVA_PRODUCTION = process.env.PRIVATE_KEY_ALVA_PRODUCTION;
const RPC_URL_AVALANCHE_C = process.env.RPC_URL_AVALANCHE_C;
const RPC_URL_ETHEREUM = process.env.RPC_URL_ETHEREUM;

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.26",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
      saveDeployments: true,
      timeoutBlocks: 200,
      sleepBetween: 5000

      // forking: {
      //   enabled: true,
      //   url: "https://rpc.ankr.com/eth_sepolia",
      //   blockNumber: 5522612,
      // },
      // allowUnlimitedContractSize: true,
    },
    goerli: {
      url: "https://sepolia.infura.io/v3/",
      accounts: [],
      timeoutBlocks: 200,
    sleepBetween: 5000
    },
    mainnet: {
      url: RPC_URL_ETHEREUM,
      accounts: [PRIVATE_KEY_ALVA_PRODUCTION],
      chainId: 1,
      timeoutBlocks: 200,
      sleepBetween: 5000
  
    },
    hardhatLocal: {
      url: "http://127.0.0.1:8545/",
      chainId: 1337,
      timeoutBlocks: 200,
      sleepBetween: 5000,  
      mining: {
        auto: true,
        interval: 5000,
      },
    },
    sepolia: {
      chainId: 11155111,
      url: RPC_ENDPOINT_SEPOLIA_NETWORK,
      accounts: [PRIVATE_KEY_ACCOUNT_SEPOLIA],
      saveDeployments: false,
      timeoutBlocks: 200,
      sleepBetween: 5000
  
    },
    fuji: {
      chainId: 43113,
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [PRIVATE_KEY_ACCOUNT_SEPOLIA],
      timeoutBlocks: 200,
      sleepBetween: 5000  
    },
    avalancheMainnet: {
      chainId: 43114,
      url: RPC_URL_AVALANCHE_C,
      accounts: [PRIVATE_KEY_ALVA_PRODUCTION],
      timeoutBlocks: 200,
      sleepBetween: 5000
  
    },
  },
  etherscan: {
    apiKey: API_KEY_ETHERSCAN,
    requestTimeout: 1000000000,
  },
  sourcify: {
    enabled: true,
    requestTimeout: 1000000000,
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    token: "ETH",
    coinmarketcap: API_KEY_COINMARKET_CAP,
    outputFile: "gas-repoter.txt",
    noColors: true,
    gasPriceApi: `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=${API_KEY_ETHERSCAN}`,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  mocha: {
    timeout: 1e14,
  },
};
