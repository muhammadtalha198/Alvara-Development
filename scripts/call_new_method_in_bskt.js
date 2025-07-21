const { ethers, upgrades, network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat.config");
const bskt = require("../artifacts/contracts/BSKT.sol/BasketTokenStandard.json");
const bsktPair = require("../artifacts/contracts/tokens/BSKTPair.sol/BasketTokenStandardPair.json");

async function main() {
  
  const bsktABI = bskt.abi;
  const bsktPairABI = bsktPair.abi;

  const rpc = network.config.url;
  const chainId = network.config.chainId;

  const priKey = networkConfig[chainId].deployerKey;

  const bsktAddress = "0x2a3F2f6E98656c0A633f9CD0f57f567c6E177081";

  const provider = new ethers.JsonRpcProvider(rpc, chainId);
  const signer = new ethers.Wallet(priKey, provider);

  const bsktContract = new ethers.Contract(bsktAddress, bsktABI, signer);

  let newMethodOutput = await bsktContract.myNewMethod();

  console.log("newMethodOutput (BSKT) : ", newMethodOutput)


  const bsktPairAddress = "0x6B47cC9307f53bD2A2AA5896164B7fE845832742";

 
  const bsktPairContract = new ethers.Contract(bsktPairAddress, bsktPairABI, signer);

  let newMethodOutputPair = await bsktPairContract.myNewMethod();

  console.log("newMethodOutput (BSKT-Pair): ", newMethodOutputPair)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
