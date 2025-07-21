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

  const bskt = await deploy("BasketTokenStandard", {
    from: deployer,
    args: [],
    waitConfirmations: 1,
  });

  let bsktAddress = bskt.address;
  log(`BSKT (Mainnet) deployed at ${bsktAddress}`);

  if (!developmentChains.includes(networkConfig[chainId].name)) {
    await verify(bsktAddress, []);
  }
};

module.exports.tags = ["bskt-implementation-mainnet"];
