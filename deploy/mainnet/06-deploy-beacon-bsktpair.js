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

  let bsktPairAddress = ""; //bsktpair address mainnet  
 

  const bsktPairBeacon = await deploy("BSKTPairBeacon", {
    from: deployer,
    waitConfirmations: 1,
    args: [bsktPairAddress],
  });

  let bsktPairBeaconAddress = bsktPairBeacon.address;
  log(`BSKT-Pair Beacon (Mainnet) deployed at ${bsktPairBeaconAddress}`);

  if (!developmentChains.includes(networkConfig[chainId].name)) {
    await verify(bsktPairBeaconAddress, [bsktPairAddress], "contracts/tokens/BSKTPairBeacon.sol:BSKTPairBeacon");
  }
};

module.exports.tags = ["bsktpair-beacon-mainnet"];
