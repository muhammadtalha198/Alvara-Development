const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat.config");
const { verify } = require("../../utils/verify");

/**
 * @notice Deploys the BSKTPairV2 contract for testing beacon proxy pattern
 * @dev This script deploys the implementation contract only, not the proxy
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  log("----------------------------------------------------");
  log("Deploying BSKTPairV2 implementation for beacon proxy testing...");

  const bsktPairV2 = await deploy("BSKTPairV2", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  let bsktPairV2Address = bsktPairV2.address;
  log(`BSKTPairV2 implementation deployed at ${bsktPairV2Address}`);

  // Verify on Etherscan if not on a development chain
  if (!developmentChains.includes(networkConfig[chainId]?.name)) {
    log("Verifying on Etherscan...");
    await verify(bsktPairV2Address, []);
  }
  
  log("----------------------------------------------------");
};

module.exports.tags = ["all-eth","all-mocks", "bsktpairv2", "test", "beacon-test", "v2-implementations"];
