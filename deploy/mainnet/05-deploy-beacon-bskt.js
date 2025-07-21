const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat.config");
const { verify } = require("../../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  let bsktAddress = "" // mainnet bskt address;


   
  const bsktBeaconProxy = await deploy("BSKTBeacon", {
    from: deployer,
    waitConfirmations: 1,
    args: [bsktAddress],
  });

  let bsktBeaconAddress = bsktBeaconProxy.address;
  log(`BeaconBSKT (Mainnet) deployed at ${bsktBeaconAddress}`);


  if (!developmentChains.includes(networkConfig[chainId].name)) {
    await verify(bsktBeaconAddress, [bsktAddress], "contracts/BSKTBeacon.sol:BSKTBeacon");
  }
};

module.exports.tags = ["bskt-beacon-mainnet",];
