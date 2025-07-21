// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const ALVA = await hre.ethers.getContractFactory("Alvara");
  const alva = await hre.upgrades.deployProxy(ALVA);
  await alva.waitForDeployment();
  const alvaAddress = await alva.getAddress();
  console.log("alva", alvaAddress);

  const BSKT = await hre.ethers.getContractFactory("BasketTokenStandard");
  const bskt = await BSKT.deploy();
  await bskt.waitForDeployment();
  const bsktAddress = await bskt.getAddress();
  console.log("BSKT", bsktAddress);

  const BSKTPair = await hre.ethers.getContractFactory(
    "BasketTokenStandardPair"
  );
  const bsktPair = await BSKTPair.deploy();
  await bsktPair.waitForDeployment();
  const bsktPairAddress = await bsktPair.getAddress();
  console.log("BSKT Pair", bsktPairAddress);

  const Factory = await hre.ethers.getContractFactory("Factory");
  const factory = await hre.upgrades.deployProxy(Factory, [
    alvaAddress,
    500,
    bsktAddress,
    bsktPairAddress,
  ]);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("factory", factoryAddress);

  // const Factory = await hre.ethers.getContractFactory("Factory");
  // const fact = await Factory.deploy();
  // await fact.deployed();
  // console.log("factory", fact.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
