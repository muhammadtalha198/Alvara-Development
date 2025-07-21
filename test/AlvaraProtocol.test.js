const { expect } = require("chai");
const { ethers, upgrades, deployments } = require("hardhat");
const { createBSKTAndGetInstance } = require("./utils/bskt-helper");

describe.only("Alvara-protocol", () => {
  let allDeployments;
  let owner, user1, user2, user3, user4, user5, user6;
  let router, wETH, alva, bsktBeacon, bsktPairBeacon, factory, bskt, bsktPair;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5, user6] =
      await ethers.getSigners();

    allDeployments = await deployments.fixture(["all-eth"]);

    wETH = await ethers.getContractAt("WETH", allDeployments["WETH"].address);

    router = await ethers.getContractAt(
      "UniswapV2Router02",
      allDeployments["UniswapV2Router02"].address
    );

    alva = await ethers.getContractAt(
      "Alvara",
      allDeployments["Alvara"].address
    );

    bskt = await ethers.getContractAt(
      "BasketTokenStandard",
      allDeployments["BasketTokenStandard"].address
    );

    bsktPair = await ethers.getContractAt(
      "BasketTokenStandardPair",
      allDeployments["BasketTokenStandardPair"].address
    );

    bsktBeacon = await ethers.getContractAt(
      "BSKTBeacon",
      allDeployments["BSKTBeacon"].address
    );

    bsktPairBeacon = await ethers.getContractAt(
      "BSKTPairBeacon",
      allDeployments["BSKTPairBeacon"].address
    );

    factory = await ethers.getContractAt(
      "Factory",
      allDeployments["Factory"].address
    );

    await preprocessing();
  });

  const preprocessing = async () => {
    await setAlvaTokenDetails();
    await alvaPreprocessing();
  };

  const alvaPreprocessing = async () => {
    await alva.setListingTimestamp(0);
  };

  const setWETHTokenDetails = async () => {
    const wethPriceInEth = ethers.parseEther("1"); // Alva price in USD, then usd to eth, then eth to wei
    const wethAddress = await wETH.getAddress();

    let res = await setTokenDetails(wethAddress, wethPriceInEth, wETH);

    return res;
  };

  const setAlvaTokenDetails = async () => {
    const alvaPriceInEth = ethers.parseEther("0.000023"); // Alva price in USD, then usd to eth, then eth to wei
    const alvaAddress = await alva.getAddress();

    let res = await setTokenDetails(alvaAddress, alvaPriceInEth, alva);

    return res;
  };

  const setTokenDetails = async (tokenAddress, priceInEth, tokenContract) => {
    const wethAddress = await wETH.getAddress();

    await router.setTokenDetails(tokenAddress, owner, priceInEth);

    const path1 = [wethAddress, tokenAddress];

    let amountOfTokens1 = await router.getAmountsOut(priceInEth, path1);

    expect(amountOfTokens1[1]).to.be.equal(ethers.parseEther("1"));

    const routerAddress = await router.getAddress();
    const allowedAmount = ethers.parseEther("10000000000000000000000000000");

    tokenContract.approve(routerAddress, allowedAmount);

    return {
      priceInEth,
      wethAddress,
      tokenAddress,
      path1,
      amountOfTokens1,
    };
  };

  describe("Initialize Values", function () {
    it("Alva should be initialized", async function () {
      let alvaAddress = await alva.getAddress();
      let factoryAlvaAddress = await factory.alva();
      expect(factoryAlvaAddress).to.be.equal(alvaAddress);
    });

    it("BSKT should be initialized", async function () {
      let bsktAddress = await bsktBeacon.getAddress();
      let factoryBsktAddress = await factory.bsktImplementation();
      expect(factoryBsktAddress).to.be.equal(bsktAddress);
    });

    it("BSKT Pair should be initialized", async function () {
      let bsktPairAddress = await bsktPairBeacon.getAddress();
      let factoryBsktPairAddress = await factory.bsktPairImplementation();
      expect(factoryBsktPairAddress).to.be.equal(bsktPairAddress);
    });

    it("Minimum Percentage should be 5%", async function () {
      let factoryMinAlvaPercentage = await factory.minPercentALVA();
      expect(factoryMinAlvaPercentage).to.be.equal(500);
    });

    it("BSKT should be set to BeaconProxy", async function () {
      let bsktAddress = await bskt.getAddress();
      let beaconBsktAddress = await bsktBeacon.implementation();
      expect(bsktAddress).to.be.equal(beaconBsktAddress);
    });

    it("BSKTPair should be set to BeaconProxy", async function () {
      let bsktpairAddress = await bsktPair.getAddress();
      let beaconBsktpairAddress = await bsktPairBeacon.implementation();
      expect(bsktpairAddress).to.be.equal(beaconBsktpairAddress);
    });
  });

  describe("Bskt", function () {   
    it("Bskt should be created", async function () {
      const name = "MY BSKT";
      const symbol = "M-BSKT";
      const alvaAddress = await alva.getAddress();
      const tokens = [alvaAddress];
      const weights = ["10000"];
      const tokenURI = "https://my-bskt/testing.json";
      const autoRebalance = true;
      const buffer = "1000";
      const description = "This is testing BSKT";
      const id = "1";

      const initialInvestingAmount = "5";

      const bsktInstance = await createBSKTAndGetInstance(factory, owner, name, symbol, tokens, weights, tokenURI, buffer, id, description, autoRebalance, initialInvestingAmount);
      const bsktOwner = await bsktInstance.ownerOf(0);
      expect(bsktOwner).to.be.equal(owner.address);

    });
    it("should assign the correct owner to the newly created BSKT token", async function () {
      const name = "MY BSKT";
      const symbol = "M-BSKT";
      const alvaAddress = await alva.getAddress();
      const tokens = [alvaAddress];
      const weights = ["10000"];
      const tokenURI = "https://my-bskt/testing.json";
      const autoRebalance = true;
      const buffer = "1000";
      const description = "This is testing BSKT";
      const id = "1";

      const initialInvestingAmount = "5";

      const bsktInstance = await createBSKTAndGetInstance(factory, owner, name, symbol, tokens, weights, tokenURI, buffer, id, description, autoRebalance, initialInvestingAmount);
      const bsktOwner = await bsktInstance.ownerOf(0);
      expect(bsktOwner).to.be.equal(owner.address);
    });
    it("should set the correct factory address in the BSKT contract", async function () {
      const name = "MY BSKT";
      const symbol = "M-BSKT";
      const alvaAddress = await alva.getAddress();
      const tokens = [alvaAddress];
      const weights = ["10000"];
      const tokenURI = "https://my-bskt/testing.json";
      const autoRebalance = true;
      const buffer = "1000";
      const description = "This is testing BSKT";
      const id = "1";

      const initialInvestingAmount = "5";

      const bsktInstance = await createBSKTAndGetInstance(factory, owner, name, symbol, tokens, weights, tokenURI, buffer, id, description, autoRebalance, initialInvestingAmount);

      const bsktFactory = await bsktInstance.factory();
      expect(bsktFactory).to.be.equal(await factory.getAddress());
    });
  });
});
