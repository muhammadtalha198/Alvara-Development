const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat.config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  let bsktAddress;
  
  if (developmentChains.includes(networkConfig[chainId].name)) { 
    bsktAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"//(await deployments.get("BasketTokenStandard")).address; 
  } else {
    bsktAddress = "0x0df65f59f61DCe8296416a2c10576159e78F7d05"//(await deployments.get("BasketTokenStandard")).address; //0x8A71Ccf8568116a8535A894C96182574eFa20a5D 
  }
 
  const bsktBeaconProxy = await deploy("BSKTBeacon", {
    from: deployer,
    waitConfirmations: 1,
    args: [bsktAddress],
  });

  let bsktBeaconAddress = bsktBeaconProxy.address;
  log(`BeaconBSKT deployed at ${bsktBeaconAddress}`);


  if (!developmentChains.includes(networkConfig[chainId].name)) {
    await verify(bsktBeaconAddress, [bsktAddress], "contracts/BSKTBeacon.sol:BSKTBeacon");
  }
};

module.exports.tags = ["all-eth", "bskt-beacon", "all-custom-test"];
