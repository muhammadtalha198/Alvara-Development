const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat.config");
const { verify } = require("../utils/verify");
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  let monthlyFee = "833333333333333";

  // Custom Router Configuration
  const ROUTER = "0x73f19dECFd263f09139c5A4DEe9B5aBc535828DF"; // Testnet - Custom-Router
  const WETH = "0xD26d007552DC4733Ce9Cd309c9c3cf6987140883"; // Testnet - Custom-WETH

  // Get deployed contract addresses
  const alvaAddress = "0x0fc4580f70C517B148a141f3721C5138f74401b1"; //(await deployments.get("Alvara")).address;
  const bsktBeaconAddress = "0x2CDb2A5626949672fD9ce96Bb665B6E904CD6c3d"; //(await deployments.get("BeaconLayer")).address;
  const bsktPairBeaconAddress = "0x59E39754AF20e7B150E8A758b86bAB9179c45A92"; //(await deployments.get("BSKTPairBeacon")).address;
  const feeCollector = "0xA5de4D331f7A61dd0179b4f1493EC1e2D713AE29"; // Wallet address to collect ALVARA Platform Fee

  log("----------------------------------------------------");
  log("Deploying Factory with Custom Router");
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
            "ipfs://QmYmQh2LiXgEp7ioTCYz3xUQcm8vEeMEPfer6jDfFH5pdX", // _collectionUri
            feeCollector,
            "0xA094E566b61b3c2D88ACf7Cc15e3Dd0FA83F32af", // defaultMarketplace
            ROUTER,                     // _routerAddress
            WETH,                       // _wethAddress
            ethers.parseEther("0.01"),  // _minBSKTCreationAmount (default 0.01 ETH)
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

module.exports.tags = ["factory-custom"];
