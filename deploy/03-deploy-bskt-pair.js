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

  const bsktPair = await deploy("BasketTokenStandardPair", {
    from: deployer,
    args: [],
    waitConfirmations: 1,
  });

  let bsktPairAddress = bsktPair.address;
  log(`BSKT Pair deployed at ${bsktPairAddress}`);

  if (!developmentChains.includes(networkConfig[chainId].name)) {
    await verify(bsktPairAddress, []);
  }
};

module.exports.tags = ["all-eth", "bskt-pair", "all-custom-test", "bskt-pair-implementation"];