const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat.config");
const { verify } = require("../../utils/verify");
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  let monthlyFee = "833333333333333";

  //Uniswap Router Configuration
  const ROUTER = ""; // Mainnet uniswap Router
  const WETH = ""; // Mainnet - uniswap-WETH

  // Get deployed contract addresses
  const alvaAddress = "0x8e729198d1C59B82bd6bBa579310C40d740A11C2"; // Alva address mainnet
  const bsktBeaconAddress = ""; // bskt-beacon address mainnet 
  const bsktPairBeaconAddress = ""; // bskt-pair-beacon address mainnet
  const feeCollector = ""; // Fee-collector address mainnet 
  const collectionUri = ""; // Collection URI for mainnet 
  const defaultMarketplaceAddress = ""; // Default supported marketplace address 
  const minBSKTCreationAmountInEth = ""; //ethers.parseEther("0.01") // minimum amount to created a basket 


  log("----------------------------------------------------");
  log("Deploying Factory on Mainet ");
  log("----------------------------------------------------");

  const factory = await deploy("Factory", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [
            alvaAddress, // _alva
            500, // _minPercentALVA (5%)
            bsktBeaconAddress, // _bsktImplementation
            bsktPairBeaconAddress, // _bsktPairImplementation
            monthlyFee, // _monthlyFee
            deployer, // _royaltyReceiver
            collectionUri,
            feeCollector,
            defaultMarketplaceAddress, // defaultMarketplace
            ROUTER,                     // _routerAddress
            WETH,                       // _wethAddress
            minBSKTCreationAmountInEth,  // _minBSKTCreationAmount (default 0.01 ETH)
          ],
        },
      },
    },
  });

  log(`Factory deployed at ${factory.address}`);

  // Verify the implementation contract
  if (!developmentChains.includes(networkConfig[chainId].name)) {
    log("Verifying...");
    await verify(factory.implementation, []);
  }
};

module.exports.tags = ["factory-mainnet"];
