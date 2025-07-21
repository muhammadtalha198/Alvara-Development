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

  let bsktPairAddress;  

  if (developmentChains.includes(networkConfig[chainId].name)) { 
    bsktPairAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"//(await deployments.get("BasketTokenStandard")).address; 
  } else {
    bsktPairAddress = "0x0985f47fc66B0d38761d64Ce72Ae6996DF50A983"//(await deployments.get("BasketTokenStandardPair")).address; //0xb9B344BA54A8dc4307D1461c79DfE157238B3f7A 
  }
 

  const bsktPairBeacon = await deploy("BSKTPairBeacon", {
    from: deployer,
    waitConfirmations: 1,
    args: [bsktPairAddress],
  });

  let bsktPairBeaconAddress = bsktPairBeacon.address;
  log(`BSKT-Pair Beacon deployed at ${bsktPairBeaconAddress}`);

  if (!developmentChains.includes(networkConfig[chainId].name)) {
    await verify(bsktPairBeaconAddress, [bsktPairAddress], "contracts/tokens/BSKTPairBeacon.sol:BSKTPairBeacon");
  }
};

module.exports.tags = ["all-eth", "bsktpair-beacon", "all-custom-test"];
