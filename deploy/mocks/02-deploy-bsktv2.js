const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat.config");
const { verify } = require("../../utils/verify");

/**
 * @notice Deploys the BSKTV2 contract for testing beacon proxy pattern
 * @dev This script deploys the implementation contract only, not the proxy
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  log("----------------------------------------------------");
  log("Deploying BSKTV2 implementation for beacon proxy testing...");

  const bsktV2 = await deploy("BSKTV2", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  let bsktV2Address = bsktV2.address;
  log(`BSKTV2 implementation deployed at ${bsktV2Address}`);

  // Verify on Etherscan if not on a development chain
  if (!developmentChains.includes(networkConfig[chainId]?.name)) {
    log("Verifying on Etherscan...");
    await verify(bsktV2Address, []);
  }
  
  log("----------------------------------------------------");
};

module.exports.tags = ["all-eth","all-mocks", "bsktv2", "test", "beacon-test", "v2-implementations"];
