const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

describe.only("Beacon Proxy", () => {
  // Signers
  let owner, user1, user2, user3, user4, user5, user6;

  // Contract instances - V1 implementations
  let bskt, bsktPair, factory, wETH, alva, mtToken, router;

  // Contract instances - V2 implementations
  let bsktV2, bsktPairV2;

  // Beacon contracts
  let bsktBeacon, bsktPairBeacon;

  // Contract addresses
  let bsktAddress,
    bsktPairAddress,
    factoryAddress,
    wETHAddress,
    alvaAddress,
    mtTokenAddress,
    routerAddress;
  let bsktV2Address, bsktPairV2Address;
  let bsktBeaconAddress, bsktPairBeaconAddress;

  // Constants
  const name = "MY-Token";
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const tokenURI = "https://my-nft.test.metadata.come";
  const description = "This is a test NFT";

  let bskt1, bskt2;
  let bskt1Address, bskt2Address;
  let bsktPair1, bsktPair2;
  let bsktPair1Address, bsktPair2Address;

  let tokens, weights;
  let bsktDetails = {
    name: "My-bskt",
    symbol: "M-bskt",
    tokens: [],
    weights: ["5000", "5000"],
    tokenURI: "https://bskt-metadata.com",
    buffer: 100,
    _id: "testId7",
    description: "This is testing bskt",
  };

  // Calculate Deadline
  function calculateDeadline(minutes = 20) {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const buffer = minutes * 60; // Convert minutes to seconds
    return currentTime + buffer;
  }

  // Calculate Deadline
  async function prePostDeploymentActivities() {
    // Deploy all base contracts
    const allDeployments = await deployments.fixture(["all-eth"]);

    // Get V1 implementation contracts
    wETH = await ethers.getContractAt("WETH", allDeployments["WETH"].address);
    bsktAddress = allDeployments["BasketTokenStandard"].address;

    bskt = await ethers.getContractAt("BasketTokenStandard", bsktAddress);

    bsktPairAddress = allDeployments["BasketTokenStandardPair"].address;
    bsktPair = await ethers.getContractAt(
      "BasketTokenStandardPair",
      bsktPairAddress
    );

    factoryAddress = allDeployments["Factory"].address;
    factory = await ethers.getContractAt("Factory", factoryAddress);

    alvaAddress = allDeployments["Alvara"].address;
    alva = await ethers.getContractAt("Alvara", alvaAddress);

    mtTokenAddress = allDeployments["MockToken"].address;
    mtToken = await ethers.getContractAt("MockToken", mtTokenAddress);

    routerAddress = allDeployments["UniswapV2Router02"].address;
    router = await ethers.getContractAt("UniswapV2Router02", routerAddress);

    // Get beacon contracts
    bsktBeaconAddress = allDeployments["BSKTBeacon"].address;
    bsktBeacon = await ethers.getContractAt("BSKTBeacon", bsktBeaconAddress);

    bsktPairBeaconAddress = allDeployments["BSKTPairBeacon"].address;
    bsktPairBeacon = await ethers.getContractAt(
      "BSKTPairBeacon",
      bsktPairBeaconAddress
    );

    // Get V2 implementation contracts
    bsktV2Address = allDeployments["BSKTV2"].address;
    bsktV2 = await ethers.getContractAt("BSKTV2", bsktV2Address);
    bsktPairV2Address = allDeployments["BSKTPairV2"].address;
    bsktPairV2 = await ethers.getContractAt("BSKTPairV2", bsktPairV2Address);

    // Store all addresses
    wETHAddress = await wETH.getAddress();
    alvaAddress = await alva.getAddress();
    bsktAddress = await bskt.getAddress();
    bsktPairAddress = await bsktPair.getAddress();
    factoryAddress = await factory.getAddress();
    mtTokenAddress = await mtToken.getAddress();
    routerAddress = await router.getAddress();
    bsktBeaconAddress = await bsktBeacon.getAddress();
    bsktPairBeaconAddress = await bsktPairBeacon.getAddress();
    bsktV2Address = await bsktV2.getAddress();
    bsktPairV2Address = await bsktPairV2.getAddress();

    //set price to Router
    await router.setTokenDetails(
      wETHAddress,
      owner.address,
      ethers.parseEther("1")
    );
    await router.setTokenDetails(
      alvaAddress,
      owner.address,
      ethers.parseEther("1")
    );
    await router.setTokenDetails(
      mtTokenAddress,
      owner.address,
      ethers.parseEther("1")
    );

    //allow token amount
    await wETH.mint(owner.address, ethers.parseEther("100000000000"));
    await wETH.approve(routerAddress, ethers.parseEther("100000000000"));
    await alva.approve(routerAddress, ethers.parseEther("100000000000"));
    await mtToken.approve(routerAddress, ethers.parseEther("100000000000"));

    await alva.setListingTimestamp("100");

    await factory.grantRole(await factory.ADMIN_ROLE(), owner.address);
    await factory.grantRole(await factory.FEE_MANAGER_ROLE(), owner.address);
    await factory.grantRole(
      await factory.WHITELIST_MANAGER_ROLE(),
      owner.address
    );
    await factory.grantRole(await factory.UPGRADER_ROLE(), owner.address);
    await factory.grantRole(await factory.URI_MANAGER_ROLE(), owner.address);
  }

  async function bsktCreationV1(id, tokens, weights) {
    bsktDetails.tokens = tokens;
    bsktDetails.weights = weights;

    const ethValue = ethers.parseEther("1");

    let totalBSKTs = await factory.totalBSKT();

    // Create basket via factory.createBSKT method
    const bsktTx = await factory.createBSKT(
      bsktDetails.name + id,
      bsktDetails.symbol + id,
      bsktDetails.tokens,
      bsktDetails.weights,
      bsktDetails.tokenURI,
      bsktDetails.buffer,
      id,
      bsktDetails.description,
      calculateDeadline(20),
      { value: ethValue }
    );

    await bsktTx.wait();

    let totalBSKTsPost = await factory.totalBSKT();

    expect(totalBSKTsPost).to.be.equal(totalBSKTs + 1n);

    // Get the basket and pair address
    let bsktAddress1 = await factory.getBSKTAtIndex(totalBSKTs);
    let bskt1 = await ethers.getContractAt("BasketTokenStandard", bsktAddress1);

    let bsktPairAddress1 = await bskt1.bsktPair();
    let bsktPair1 = await ethers.getContractAt(
      "BasketTokenStandardPair",
      bsktPairAddress1
    );

    return { bsktAddress1, bskt1, bsktPairAddress1, bsktPair1Address };
  }

  async function bsktCreationV2(id, tokens, weights) {
    bsktDetails.tokens = tokens;
    bsktDetails.weights = weights;

    const ethValue = ethers.parseEther("1");

    let totalBSKTs = await factory.totalBSKT();

    // Create basket via factory.createBSKT method
    const bsktTx = await factory.createBSKT(
      bsktDetails.name + id,
      bsktDetails.symbol + id,
      bsktDetails.tokens,
      bsktDetails.weights,
      bsktDetails.tokenURI,
      bsktDetails.buffer,
      id,
      bsktDetails.description,
      calculateDeadline(20),
      { value: ethValue }
    );

    await bsktTx.wait();

    let totalBSKTsPost = await factory.totalBSKT();

    expect(totalBSKTsPost).to.be.equal(totalBSKTs + 1n);

    // Get the basket and pair address
    let bsktAddress1 = await factory.getBSKTAtIndex(totalBSKTs);
    let bskt1 = await ethers.getContractAt("BSKTV2", bsktAddress1);

    let bsktPairAddress1 = await bskt1.bsktPair();
    let bsktPair1 = await ethers.getContractAt(
      "BSKTPairV2",
      bsktPairAddress1
    );

    return { bsktAddress1, bskt1, bsktPairAddress1, bsktPair1Address };
  }

  async function contributionToBSKT(bskt, bsktAddress, ethValue) {
    const buffer = 2000n;

    await expect(
      bskt.contribute(buffer, calculateDeadline(20), { value: ethValue })
    )
      .to.emit(bskt, "ContributedToBSKT")
      .withArgs(bsktAddress, owner.address, ethValue);
  }

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5, user6] =
      await ethers.getSigners();

    await prePostDeploymentActivities();

    // Setup tokens and weights for baskets
    tokens = [wETHAddress, alvaAddress];
    weights = ["5000", "5000"]; // 50% - 50%

    let bsktData = await bsktCreationV1("1", tokens, weights);
    bskt1Address = bsktData.bsktAddress1;
    bskt1 = bsktData.bskt1;
    bsktPair1Address = bsktData.bsktPairAddress1;
    bsktPair1 = bsktData.bsktPair1Address;

    const ethValue = ethers.parseEther("1");

    // contribute to bskt1
    await contributionToBSKT(bskt1, bskt1Address, ethValue);

    bsktData = await bsktCreationV1("2", tokens, weights);
    bskt2Address = bsktData.bsktAddress1;
    bskt2 = bsktData.bskt1;
    bsktPair2Address = bsktData.bsktPairAddress1;
    bsktPair2 = bsktData.bsktPair1Address;

    // contribute to bskt2
    await contributionToBSKT(bskt2, bskt2Address, ethValue);
  });

  describe("Initialize Values", function () {
    it("Alva should be set with given address", async function () {
      const factoryAlva = await factory.alva();
      expect(factoryAlva).to.be.equal(alvaAddress);
    });

    it("Bskt implementation at Factory should be set with given beacon-bskt address", async function () {
      const factoryBsktImplementation = await factory.bsktImplementation();
      expect(factoryBsktImplementation).to.be.equal(bsktBeaconAddress);
    });

    it("Bskt pair implementation at Factory should be set with given beacon-bskt-pair address", async function () {
      const factoryBsktPairImplementation =
        await factory.bsktPairImplementation();
      expect(factoryBsktPairImplementation).to.be.equal(bsktPairBeaconAddress);
    });

    it("Bskt implementation at Beacon should be set with given bskt address", async function () {
      const bsktBeaconImplementation = await bsktBeacon.implementation();
      expect(bsktBeaconImplementation).to.be.equal(bsktAddress);
    });

    it("Bskt pair implementation at Beacon should be set with given bskt-pair address", async function () {
      const bsktPairBeaconImplementation =
        await bsktPairBeacon.implementation();
      expect(bsktPairBeaconImplementation).to.be.equal(bsktPairAddress);
    });

    it("Should maintain state after upgrade to V2", async function () {
      // Test that state is maintained after upgrade
    });

    it("Should be able to use new V2 functionality", async function () {
      // Test new V2 functionality
    });
  });

  describe("BSKTV2", function () {
    beforeEach(async function () {
      // Update implementation to v2
      await bsktBeacon.upgradeTo(bsktV2Address);
      await bsktPairBeacon.upgradeTo(bsktPairV2Address);

      // Confirm the implementation 
      const bsktBeaconImplementation = await bsktBeacon.implementation();
      expect(bsktBeaconImplementation).to.be.equal(bsktV2Address);

      const bsktPairBeaconImplementation = await bsktPairBeacon.implementation();
      expect(bsktPairBeaconImplementation).to.be.equal(bsktPairV2Address);
    });
      
    it("Contribution should work after upgrade", async function () {
      const buffer = 500n; // Adjusted to be within the acceptable range (1-4999)
      const ethValue = ethers.parseEther("1");
      
      // Get a fresh instance of the contract after upgrade
      const upgradedBskt = await ethers.getContractAt("BSKTV2", bskt1Address);
      
      await expect(
        upgradedBskt.contribute(buffer, calculateDeadline(20), { value: ethValue })
      )
        .to.emit(upgradedBskt, "ContributedToBSKTV2")
        .withArgs(bskt1Address, owner.address, ethValue);
    });


    it("Withdraw should work after upgrade", async function () {
      const buffer = 500n; // Adjusted to be within the acceptable range (1-4999)
      const ethValue = ethers.parseEther("1");
      
      // Get a fresh instance of the contract after upgrade
      const upgradedBskt = await ethers.getContractAt("BSKTV2", bskt1Address);
      const upgradedBsktPair = await ethers.getContractAt("BSKTPairV2", bsktPair1Address);
      
      await expect(
        upgradedBskt.contribute(buffer, calculateDeadline(20), { value: ethValue })
      )
        .to.emit(upgradedBskt, "ContributedToBSKTV2")
        .withArgs(bskt1Address, owner.address, ethValue);
      
      let lpBalance = await upgradedBsktPair.balanceOf(owner.address);

      await upgradedBsktPair.approve(bskt1Address, lpBalance);

      await expect(
        upgradedBskt.withdraw(lpBalance/2n,buffer, calculateDeadline(20))
      )
        .to.emit(upgradedBskt, "WithdrawnFromBSKTV2")
        .withArgs(bskt1Address, owner.address, []);

    });

    it("withdrawETH should work after upgrade", async function () {
      const buffer = 500n; // Adjusted to be within the acceptable range (1-4999)
      const ethValue = ethers.parseEther("1");
      
      // Get a fresh instance of the contract after upgrade
      const upgradedBskt = await ethers.getContractAt("BSKTV2", bskt1Address);
      const upgradedBsktPair = await ethers.getContractAt("BSKTPairV2", bsktPair1Address);
      
      await expect(
        upgradedBskt.contribute(buffer, calculateDeadline(20), { value: ethValue })
      )
        .to.emit(upgradedBskt, "ContributedToBSKTV2")
        .withArgs(bskt1Address, owner.address, ethValue);
      
      let lpBalance = await upgradedBsktPair.balanceOf(owner.address);

      await upgradedBsktPair.approve(bskt1Address, lpBalance);

      await expect(
        upgradedBskt.withdrawETH(lpBalance/2n,buffer, calculateDeadline(20))
      )
        .to.emit(upgradedBskt, "WithdrawnETHFromBSKTV2")
        .withArgs(bskt1Address, owner.address, 0);

    });

    it("Rebalance should work after upgrade", async function () {
      const buffer = 500n; // Adjusted to be within the acceptable range (1-4999)
      const ethValue = ethers.parseEther("1");
      
      // Get a fresh instance of the contract after upgrade
      const upgradedBskt = await ethers.getContractAt("BSKTV2", bskt1Address);
      const upgradedBsktPair = await ethers.getContractAt("BSKTPairV2", bsktPair1Address);
      
      await expect(
        upgradedBskt.rebalance(tokens, weights,buffer, calculateDeadline(20))
      )
        .to.emit(upgradedBskt, "BSKTRebalancedV2")
        .withArgs(bskt1Address, [], [], tokens, weights);
    });

    it("Should verify V2 version after upgrade", async function () {
      // Get a fresh instance of the contract after upgrade
      const upgradedBskt = await ethers.getContractAt("BSKTV2", bskt1Address);
      
      // Verify the version is 2 (V2 implementation)
      const version = await upgradedBskt.getVersion();
      expect(version).to.equal(2n);
    });
    
    it("Should set performance fee (new V2 method)", async function () {
      // Get a fresh instance of the contract after upgrade
      const upgradedBskt = await ethers.getContractAt("BSKTV2", bskt1Address);
      
      // Set a performance fee of 10%
      const feePercent = 1000n; // 10% using PERCENT_PRECISION (10000)
      
      await expect(upgradedBskt.setPerformanceFee(feePercent))
        .to.emit(upgradedBskt, "PerformanceFeeSetV2")
        .withArgs(bskt1Address, feePercent);
    });
    
    
    it("Should collect performance fee (new V2 method)", async function () {
      // Get a fresh instance of the contract after upgrade
      const upgradedBskt = await ethers.getContractAt("BSKTV2", bskt1Address);
      
      // First set a performance fee
      const feePercent = 1000n; // 10%
      await upgradedBskt.setPerformanceFee(feePercent);
      
      // Then collect the performance fee
      await expect(upgradedBskt.collectPerformanceFee())
        .to.emit(upgradedBskt, "PerformanceFeeCollectedV2")
        .withArgs(bskt1Address, owner.address, 0);
    });

    it("New BSKT will be created and should work after upgrade", async function () {

      let bsktData = await bsktCreationV2("3", tokens, weights);
      let bskt3Address = bsktData.bsktAddress1;
      let bskt3 = bsktData.bskt1;
      let bsktPair3Address = bsktData.bsktPairAddress1;
      let bsktPair3 = bsktData.bsktPair1Address;


      const buffer = 500n; // Adjusted to be within the acceptable range (1-4999)
      const ethValue = ethers.parseEther("1");
            
      await expect(
        bskt3.contribute(buffer, calculateDeadline(20), { value: ethValue })
      )
        .to.emit(bskt3, "ContributedToBSKTV2")
        .withArgs(bskt3Address, owner.address, ethValue);
    });

    
  });
});
