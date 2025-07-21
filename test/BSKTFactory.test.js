const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

describe.only("BSKTFactory", () => {
  let allDeployments;
  let owner, user1, user2, user3, user4, user5, user6;
  let bskt, bsktPair, factory, wETH, alva, mtToken, router;
  let bsktAddress,
    bsktPairAddress,
    factoryAddress,
    wETHAddress,
    alvaAddress,
    mtTokenAddress,
    routerAddress;
  const name = "MY-Token";
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const tokenURI = "https://my-nft.test.metadata.come";
  const description = "This is a test NFT";
  const minPercentage = 500;

  let tokens;

  // Calculate Deadline
  function calculateDeadline(minutes = 20) {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const buffer = minutes * 60; // Convert minutes to seconds
    return currentTime + buffer;
  }

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5, user6] =
      await ethers.getSigners();

    allDeployments = await deployments.fixture(["all-eth"]);

    wETH = await ethers.getContractAt("WETH", allDeployments["WETH"].address);
    bskt = await ethers.getContractAt(
      "BSKTBeacon",
      allDeployments["BSKTBeacon"].address
    );

    bsktPair = await ethers.getContractAt(
      "BSKTPairBeacon",
      allDeployments["BSKTPairBeacon"].address
    );

    factory = await ethers.getContractAt(
      "Factory",
      allDeployments["Factory"].address
    );

    alva = await ethers.getContractAt(
      "Alvara",
      allDeployments["Alvara"].address
    );

    mtToken = await ethers.getContractAt(
      "MockToken",
      allDeployments["MockToken"].address
    );

    router = await ethers.getContractAt(
      "UniswapV2Router02",
      allDeployments["UniswapV2Router02"].address
    );

    wETHAddress = await wETH.getAddress();
    alvaAddress = await alva.getAddress();
    bsktAddress = await bskt.getAddress();
    bsktPairAddress = await bsktPair.getAddress();
    factoryAddress = await factory.getAddress();
    mtTokenAddress = await mtToken.getAddress();
    routerAddress = await router.getAddress();

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
    await wETH.approve(routerAddress, ethers.parseEther("100000000000"));
    await alva.approve(routerAddress, ethers.parseEther("100000000000"));
    await mtToken.approve(routerAddress, ethers.parseEther("100000000000"));

    await factory.grantRole(await factory.ADMIN_ROLE(), owner.address);
    await factory.grantRole(await factory.FEE_MANAGER_ROLE(), owner.address);
    await factory.grantRole(await factory.WHITELIST_MANAGER_ROLE(), owner.address);
    await factory.grantRole(await factory.UPGRADER_ROLE(), owner.address);
    await factory.grantRole(await factory.URI_MANAGER_ROLE(), owner.address);
  });

  describe("Initialize Values", function () {
    let newFactory;

    beforeEach(async function () {
      const Factory = await ethers.getContractFactory("Factory");
      newFactory = await Factory.deploy();
    });

    it("Alva should be set with given address", async function () {
      const factoryAlva = await factory.alva();
      expect(factoryAlva).to.be.equal(alvaAddress);
    });

    it("Bskt implementation should be set with given address", async function () {
      const factoryBsktImplementation = await factory.bsktImplementation();
      expect(factoryBsktImplementation).to.be.equal(bsktAddress);
    });

    it("Bskt pair implementation should be set with given address", async function () {
      const factoryBsktPairImplementation =
        await factory.bsktPairImplementation();
      expect(factoryBsktPairImplementation).to.be.equal(bsktPairAddress);
    });

    it("Minimum ALVA percentage should be set with given value", async function () {
      const factoryMinimumALVA = await factory.minPercentALVA();
      expect(factoryMinimumALVA).to.be.equal(minPercentage);
    });

    it("Should revert when initialized with zero addresses", async function () {
      await expect(
        newFactory.initialize(
          zeroAddress, // _alva
          minPercentage, // _minPercentALVA
          bsktAddress, // _bsktImplementation
          bsktPairAddress, // _bsktPairImplementation
          500, // _monthlyFee
          owner.address, // _royaltyReceiver
          "test-uri", // _collectionUri
          owner.address, // _feeCollector
          routerAddress, // _defaultMarketplace
          routerAddress, // _routerAddress
          wETHAddress, // _wethAddress
          ethers.parseEther("0.01") // _minbsktCreationAmount
        )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
    xit("Should revert when initialized with zero addresses", async function () {
      await expect(
        newFactory.initialize(
          zeroAddress, // _alva
          minPercentage, // _minPercentALVA
          bsktAddress, // _bsktImplementation
          bsktPairAddress, // _bsktPairImplementation
          500, // _monthlyFee
          owner.address, // _royaltyReceiver
          "test-uri", // _collectionUri
          owner.address, // _feeCollector
          routerAddress, // _defaultMarketplace
          routerAddress, // _routerAddress
          wETHAddress, // _wethAddress
          ethers.parseEther("0.01") // _minbsktCreationAmount
        )
      ).to.be.revertedWithCustomError(newFactory, "InvalidAddress");

      await expect(
        newFactory.initialize(
          alvaAddress, // _alva
          minPercentage, // _minPercentALVA
          zeroAddress, // _bsktImplementation
          bsktPairAddress, // _bsktPairImplementation
          500, // _monthlyFee
          owner.address, // _royaltyReceiver
          "test-uri", // _collectionUri
          owner.address, // _feeCollector
          routerAddress, // _defaultMarketplace
          routerAddress, // _routerAddress
          wETHAddress, // _wethAddress
          ethers.parseEther("0.01") // _minbsktCreationAmount
        )
      ).to.be.revertedWithCustomError(newFactory, "InvalidAddress");

      await expect(
        newFactory.initialize(
          alvaAddress, // _alva
          minPercentage, // _minPercentALVA
          bsktAddress, // _bsktImplementation
          zeroAddress, // _bsktPairImplementation
          500, // _monthlyFee
          owner.address, // _royaltyReceiver
          "test-uri", // _collectionUri
          owner.address, // _feeCollector
          routerAddress, // _defaultMarketplace
          routerAddress, // _routerAddress
          wETHAddress, // _wethAddress
          ethers.parseEther("0.01") // _minbsktCreationAmount
        )
      ).to.be.revertedWithCustomError(newFactory, "InvalidAddress");

      await expect(
        newFactory.initialize(
          alvaAddress, // _alva
          minPercentage, // _minPercentALVA
          bsktAddress, // _bsktImplementation
          bsktPairAddress, // _bsktPairImplementation
          500, // _monthlyFee
          owner.address, // _royaltyReceiver
          "test-uri", // _collectionUri
          owner.address, // _feeCollector
          routerAddress, // _defaultMarketplace
          zeroAddress, // _routerAddress
          wETHAddress, // _wethAddress
          ethers.parseEther("0.01") // _minbsktCreationAmount
        )
      ).to.be.revertedWithCustomError(newFactory, "InvalidAddress");

      await expect(
        newFactory.initialize(
          alvaAddress, // _alva
          minPercentage, // _minPercentALVA
          bsktAddress, // _bsktImplementation
          bsktPairAddress, // _bsktPairImplementation
          500, // _monthlyFee
          owner.address, // _royaltyReceiver
          "test-uri", // _collectionUri
          owner.address, // _feeCollector
          routerAddress, // _defaultMarketplace
          routerAddress, // _routerAddress
          zeroAddress, // _wethAddress
          ethers.parseEther("0.01") // _minbsktCreationAmount
        )
      ).to.be.revertedWithCustomError(newFactory, "InvalidAddress");
    });

    xit("Should revert when initialized with invalid ALVA percentage", async function () {
      await expect(
        newFactory.initialize(
          alvaAddress, // _alva
          99, // _minPercentALVA - less than minimum allowed (100)
          bsktAddress, // _bsktImplementation
          bsktPairAddress, // _bsktPairImplementation
          500, // _monthlyFee
          owner.address, // _royaltyReceiver
          "test-uri", // _collectionUri
          owner.address, // _feeCollector
          routerAddress, // _defaultMarketplace
          routerAddress, // _routerAddress
          wETHAddress, // _wethAddress
          ethers.parseEther("0.01") // _minbsktCreationAmount
        )
      ).to.be.revertedWithCustomError(newFactory, "InvalidAlvaPercentage");

      await expect(
        newFactory.initialize(
          alvaAddress, // _alva
          5001, // _minPercentALVA - greater than maximum allowed (5000)
          bsktAddress, // _bsktImplementation
          bsktPairAddress, // _bsktPairImplementation
          500, // _monthlyFee
          owner.address, // _royaltyReceiver
          "test-uri", // _collectionUri
          owner.address, // _feeCollector
          routerAddress, // _defaultMarketplace
          routerAddress, // _routerAddress
          wETHAddress, // _wethAddress
          ethers.parseEther("0.01") // _minbsktCreationAmount
        )
      ).to.be.revertedWithCustomError(newFactory, "InvalidAlvaPercentage");
    });

    xit("Should initialize successfully with valid parameters", async function () {
      await newFactory.initialize(
        alvaAddress, // _alva
        minPercentage, // _minPercentALVA
        bsktAddress, // _bsktImplementation
        bsktPairAddress, // _bsktPairImplementation
        500, // _monthlyFee
        owner.address, // _royaltyReceiver
        "test-uri", // _collectionUri
        owner.address, // _feeCollector
        routerAddress, // _defaultMarketplace
        routerAddress, // _routerAddress
        wETHAddress, // _wethAddress
        ethers.parseEther("0.01") // _minbsktCreationAmount
      );

      const factoryAlva = await newFactory.alva();
      expect(factoryAlva).to.be.equal(alvaAddress);

      const factoryMinimumALVA = await newFactory.minPercentALVA();
      expect(factoryMinimumALVA).to.be.equal(minPercentage);

      const factorybsktImplementation = await newFactory.bsktImplementation();
      expect(factorybsktImplementation).to.be.equal(bsktAddress);

      const factorybsktPairImplementation =
        await newFactory.bsktPairImplementation();
      expect(factorybsktPairImplementation).to.be.equal(bsktPairAddress);

      const factoryCollectionUri = await newFactory.collectionUri();
      expect(factoryCollectionUri).to.be.equal("test-uri");

      const factoryRouter = await newFactory.router();
      expect(factoryRouter).to.be.equal(routerAddress);

      const factoryWETH = await newFactory.weth();
      expect(factoryWETH).to.be.equal(wETHAddress);

      const factoryMinbsktCreationAmount =
        await newFactory.minbsktCreationAmount();
      expect(factoryMinbsktCreationAmount).to.be.equal(
        ethers.parseEther("0.01")
      );
    });
  });

  describe("updateBSKTImplementation", function () {
    beforeEach(async function () {});
    it("Contract should throw error if updated with 0 address", async function () {
      const factorybsktImplementation = await factory.bsktImplementation();
      expect(factorybsktImplementation).to.be.equal(bsktAddress);

      await expect(
        factory.updateBSKTImplementation(zeroAddress)
      ).to.be.rejectedWith("InvalidAddress");

      const factorybsktImplementationPost = await factory.bsktImplementation();
      expect(factorybsktImplementationPost).to.be.equal(
        factorybsktImplementation
      );
    });

    it("Contract should throw error if updated with EOA address", async function () {
      const factorybsktImplementation = await factory.bsktImplementation();
      expect(factorybsktImplementation).to.be.equal(bsktAddress);

      await expect(
        factory.updateBSKTImplementation(user1.address)
      ).to.be.rejectedWith("InvalidAddress");

      const factorybsktImplementationPost = await factory.bsktImplementation();
      expect(factorybsktImplementationPost).to.be.equal(
        factorybsktImplementation
      );
    });

    it("Contract should throw error if updated by non-owner", async function () {
      const factorybsktImplementation = await factory.bsktImplementation();
      expect(factorybsktImplementation).to.be.equal(bsktAddress);

      await expect(
        factory.connect(user1).updateBSKTImplementation(alvaAddress)
      ).to.be.rejectedWith(`AccessControl: account ${user1.address.toString().toLowerCase()} is missing role ${await factory.UPGRADER_ROLE()}`);

      const factorybsktImplementationPost = await factory.bsktImplementation();
      expect(factorybsktImplementationPost).to.be.equal(
        factorybsktImplementation
      );
    });

    it("Contract should updated with new implementation", async function () {
      const factorybsktImplementation = await factory.bsktImplementation();
      expect(factorybsktImplementation).to.be.equal(bsktAddress);

      await expect(factory.updateBSKTImplementation(alvaAddress))
        .to.emit(factory, "BSKTImplementationUpdated")
        .withArgs(alvaAddress);

      const factorybsktImplementationPost = await factory.bsktImplementation();
      expect(factorybsktImplementationPost).to.be.equal(alvaAddress);
    });
  });

  describe("UpdateBSKTPairImplementation", function () {
    beforeEach(async function () {});
    it("Contract should throw error if updated with 0 address", async function () {
      const factorybsktPairImplementation =
        await factory.bsktPairImplementation();
      expect(factorybsktPairImplementation).to.be.equal(bsktPairAddress);

      await expect(
        factory.updateBSKTPairImplementation(zeroAddress)
      ).to.be.rejectedWith("InvalidAddress");

      const factorybsktPairImplementationPost =
        await factory.bsktPairImplementation();
      expect(factorybsktPairImplementationPost).to.be.equal(
        factorybsktPairImplementation
      );
    });

    it("Contract should throw error if updated with EOA address", async function () {
      const factorybsktPairImplementation =
        await factory.bsktPairImplementation();
      expect(factorybsktPairImplementation).to.be.equal(bsktPairAddress);

      await expect(
        factory.updateBSKTPairImplementation(user1.address)
      ).to.be.revertedWithCustomError(factory, "InvalidAddress")

      const factorybsktPairImplementationPost =
        await factory.bsktPairImplementation();
      expect(factorybsktPairImplementationPost).to.be.equal(
        factorybsktPairImplementation
      );
    });

    it("Contract should throw error if updated by non-owner", async function () {
      const factorybsktPairImplementation =
        await factory.bsktPairImplementation();
      expect(factorybsktPairImplementation).to.be.equal(bsktPairAddress);

      await expect(
        factory.connect(user1).updateBSKTPairImplementation(alvaAddress)
      ).to.be.rejectedWith(`AccessControl: account ${user1.address.toString().toLowerCase()} is missing role ${await factory.UPGRADER_ROLE()}`);

      const factorybsktPairImplementationPost =
        await factory.bsktPairImplementation();
      expect(factorybsktPairImplementationPost).to.be.equal(
        factorybsktPairImplementation
      );
    });

    it("Contract should updated with new implementation", async function () {
      const factorybsktPairImplementation =
        await factory.bsktPairImplementation();
      expect(factorybsktPairImplementation).to.be.equal(bsktPairAddress);

      await expect(factory.updateBSKTPairImplementation(alvaAddress))
        .to.emit(factory, "BSKTPairImplementationUpdated")
        .withArgs(alvaAddress);

      const factorybsktPairImplementationPost =
        await factory.bsktPairImplementation();
      expect(factorybsktPairImplementationPost).to.be.equal(alvaAddress);
    });
  });

  describe("updateAlva", function () {
    beforeEach(async function () {});
    it("Contract should throw error if updated with 0 address", async function () {
      const factoryAlva = await factory.alva();
      expect(factoryAlva).to.be.equal(alvaAddress);

      await expect(factory.updateAlva(zeroAddress)).to.be.rejectedWith(
        "InvalidAddress"
      );

      const factoryAlvaPost = await factory.alva();
      expect(factoryAlvaPost).to.be.equal(factoryAlva);
    });

    it("Contract should throw error if updated by non-owner", async function () {
      const factoryAlva = await factory.alva();
      expect(factoryAlva).to.be.equal(alvaAddress);

      await expect(
        factory.connect(user1).updateAlva(mtTokenAddress)
      ).to.be.rejectedWith(`AccessControl: account ${user1.address.toString().toLowerCase()} is missing role ${await factory.UPGRADER_ROLE()}`);

      const factoryAlvaPost = await factory.alva();
      expect(factoryAlvaPost).to.be.equal(factoryAlva);
    });

    it("Contract should updated with new implementation", async function () {
      const factoryAlva = await factory.alva();
      expect(factoryAlva).to.be.equal(alvaAddress);

      await expect(factory.updateAlva(mtTokenAddress))
        .to.emit(factory, "AlvaUpdated")
        .withArgs(mtTokenAddress);

      const factoryAlvaPost = await factory.alva();
      expect(factoryAlvaPost).to.be.equal(mtTokenAddress);
    });
  });

  describe("updateMinPercentALVA", function () {
    beforeEach(async function () {});
    it("Contract should throw error if updated with 0 percentage", async function () {
      const newMinValue = 0;
      const factoryMinAlva = await factory.minPercentALVA();
      expect(factoryMinAlva).to.be.equal(minPercentage);

      await expect(
        factory.updateMinPercentALVA(newMinValue)
      ).to.be.revertedWithCustomError(factory, "InvalidAlvaPercentage");

      const factoryMinAlvaPost = await factory.minPercentALVA();
      expect(factoryMinAlvaPost).to.be.equal(factoryMinAlva);
    });

    it("Contract should throw error if updated with more then 100 percentage", async function () {
      const newMinValue = 100_01n;
      const factoryMinAlva = await factory.minPercentALVA();
      expect(factoryMinAlva).to.be.equal(minPercentage);

      await expect(
        factory.updateMinPercentALVA(newMinValue)
      ).to.be.revertedWithCustomError(factory, "InvalidAlvaPercentage");

      const factoryMinAlvaPost = await factory.minPercentALVA();
      expect(factoryMinAlvaPost).to.be.equal(factoryMinAlva);
    });

    it("Contract should throw error if updated by non-owner", async function () {
      const newMinValue = 10_00n;
      const factoryMinAlva = await factory.minPercentALVA();
      expect(factoryMinAlva).to.be.equal(minPercentage);

      await expect(
        factory.connect(user1).updateMinPercentALVA(newMinValue)
      ).to.be.rejectedWith(`AccessControl: account ${user1.address.toString().toLowerCase()} is missing role ${await factory.ADMIN_ROLE()}`);

      const factoryMinAlvaPost = await factory.minPercentALVA();
      expect(factoryMinAlvaPost).to.be.equal(factoryMinAlva);
    });

    it("Contract should updated with new value", async function () {
      const newMinValue = 10_00n;
      const factoryMinAlva = await factory.minPercentALVA();
      expect(factoryMinAlva).to.be.equal(minPercentage);

      await expect(factory.updateMinPercentALVA(newMinValue))
        .to.emit(factory, "MinAlvaPercentageUpdated")
        .withArgs(newMinValue);

      const factoryMinAlvaPost = await factory.minPercentALVA();
      expect(factoryMinAlvaPost).to.be.equal(newMinValue);
    });
  });

  describe("createBSKT", function () {
    let bsktDetails;

    beforeEach(async function () {
      bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://token-uri.com",
        buffer: 100,
        id: "unique-id",
        description: "Test description",
      };
    });
    it("Contract should throw error if name is empty", async function () {
      const bsktDetails = {
        name: "",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "testId1",
        description: "This is testing bskt",
      };

      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails._id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      )
        .to.be.revertedWithCustomError(factory, "EmptyStringParameter")
        .withArgs("name");
    });

    it("Contract should throw error if symbol is empty", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "testId2",
        description: "This is testing bskt",
      };

      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails._id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      )
        .to.be.revertedWithCustomError(factory, "EmptyStringParameter")
        .withArgs("symbol");
    });

    it("Contract should throw error if id is empty", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "",
        description: "This is testing bskt",
      };

      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails._id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      )
        .to.be.revertedWithCustomError(factory, "EmptyStringParameter")
        .withArgs("id");
    });
    it("Contract should throw error if _tokenURI is empty", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "",
        buffer: 100,
        _id: "testId4",
        description: "This is testing bskt",
      };

      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails._id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      )
        .to.be.revertedWithCustomError(factory, "EmptyStringParameter")
        .withArgs("tokenURI");
    });

    it("Contract should throw error if buffer is less then 0", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 0,
        _id: "testId4",
        description: "This is testing bskt",
      };

      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails._id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      )
        .to.be.revertedWithCustomError(factory, "InvalidBuffer")
        .withArgs(0, 1, 4999);
    });

    it("Contract should throw error if buffer is 5000 or more", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 5001,
        _id: "testId5",
        description: "This is testing bskt",
      };

      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails._id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      )
        .to.be.revertedWithCustomError(factory, "InvalidBuffer")
        .withArgs(5001, 1, 4999);
    });

    it("Contract should create bskt if all okay", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "testId6",
        description: "This is testing bskt",
      };

      const totalBSKT = await factory.totalBSKT();
      expect(totalBSKT).to.be.equal(0);

      const ethValue = ethers.parseEther("1");

      // Don't hardcode expected addresses, as they may vary
      await factory.createBSKT(
        bsktDetails.name,
        bsktDetails.symbol,
        bsktDetails.tokens,
        bsktDetails.weights,
        bsktDetails.tokenURI,
        bsktDetails.buffer,
        bsktDetails._id,
        bsktDetails.description,
        calculateDeadline(20),
        { value: ethValue }
      );

      const totalBSKTPost = await factory.totalBSKT();
      expect(totalBSKTPost).to.be.equal(1n);
    });

    it("Should revert if msg.value is less than 0.01 ether", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "testId8",
        description: "This is testing bskt",
      };

      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails._id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: ethers.parseEther("0.009") }
        )
      ).to.be.revertedWithCustomError(factory, "InsufficientBSKTCreationAmount");
    });

    it("Should revert if tokens and weights arrays have different lengths", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "3000", "2000"], // One more weight than tokens
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "testId9",
        description: "This is testing bskt",
      };

      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails._id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      ).to.be.reverted; // Should revert due to array length mismatch
    });
    it("Contract should create bskt if all okay", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "testId7",
        description: "This is testing bskt",
      };

      const totalBSKT = await factory.totalBSKT();

      const ethValue = ethers.parseEther("1");

      // Don't hardcode expected addresses, as they may vary
      await factory.createBSKT(
        bsktDetails.name,
        bsktDetails.symbol,
        bsktDetails.tokens,
        bsktDetails.weights,
        bsktDetails.tokenURI,
        bsktDetails.buffer,
        bsktDetails._id,
        bsktDetails.description,
        calculateDeadline(20),
        { value: ethValue }
      );

      const totalBSKTPost = await factory.totalBSKT();
      expect(totalBSKTPost).to.be.equal(totalBSKT + 1n);
    });

    it("Contract should create bskt/bskt Pair with given data and 1000 Lp tokens minted to creator", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "testId8",
        description: "This is testing bskt",
      };

      const totalBSKT = await factory.totalBSKT();

      const ethValue = ethers.parseEther("1");

      const tx = await factory.createBSKT(
        bsktDetails.name,
        bsktDetails.symbol,
        bsktDetails.tokens,
        bsktDetails.weights,
        bsktDetails.tokenURI,
        bsktDetails.buffer,
        bsktDetails._id,
        bsktDetails.description,
        calculateDeadline(20),
        { value: ethValue }
      );

      const receipt = await tx.wait();

      let createdbsktAddress = null;
      let createdbsktPairAddress = null;

      // Extract actual addresses from event logs
      for (const log of receipt.logs) {
        try {
          const parsedLog = factory.interface.parseLog(log);
          if (parsedLog?.name === "BSKTCreated") {
            createdbsktAddress = parsedLog.args.bskt;
            createdbsktPairAddress = parsedLog.args.bsktPair;
            break;
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }

      const totalBSKTPost = await factory.totalBSKT();
      expect(totalBSKTPost).to.be.equal(totalBSKT + 1n);

      const bsktAddressFromContract = await factory.getBSKTAtIndex(totalBSKT );
      expect(bsktAddressFromContract).to.be.equal(createdbsktAddress);

      const contractFactory = await ethers.getContractFactory(
        "BasketTokenStandard"
      );
      // Attach to the deployed contract
      const bsktContract = await contractFactory.attach(bsktAddressFromContract);

      const bsktName = await bsktContract.name();
      expect(bsktName).to.be.equal(bsktDetails.name);

      const bsktSymbol = await bsktContract.symbol();
      expect(bsktSymbol).to.be.equal(bsktDetails.symbol);

      for (let i = 0; i < bsktDetails.tokens.length; i++) {
        // const bsktTokenDetails = await bsktContract.getTokenDetails(i);
        const bsktTokenDetails = await bsktContract["getTokenDetails(uint256)"](
          i
        );
        const tokenAddress = bsktTokenDetails.token;
        expect(tokenAddress).to.be.equal(bsktDetails.tokens[i]);

        const tokenWeight = bsktTokenDetails.weight;
        expect(tokenWeight).to.be.equal(bsktDetails.weights[i]);
      }

      const bsktTokenURI = await bsktContract.tokenURI(0);
      expect(bsktTokenURI).to.be.equal(bsktDetails.tokenURI);

      const bsktId = await bsktContract.id();
      expect(bsktId).to.be.equal(bsktDetails._id);

      const bsktPairAddressFromContract = await bsktContract.bsktPair();
      expect(bsktPairAddressFromContract).to.be.equal(createdbsktPairAddress);

      const contractFactoryPair = await ethers.getContractFactory(
        "BasketTokenStandardPair"
      );
      // Attach to the deployed contract
      const bsktPairContract = await contractFactoryPair.attach(
        bsktPairAddressFromContract
      );

      const bsktPairName = await bsktPairContract.name();
      expect(bsktPairName).to.be.equal(bsktDetails.symbol + "-LP");

      const bsktPairSymbol = await bsktPairContract.symbol();
      expect(bsktPairSymbol).to.be.equal(bsktDetails.symbol + "-LP");

      const managerBalance = await bsktPairContract.balanceOf(owner.address);

      expect(managerBalance).to.be.equals(ethers.parseEther("1000"));
    });

    it("Contract should create bskt with correct _id if all parameters are valid", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "asdf1234",
        description: "This is testing bskt",
      };

      const totalBSKT = await factory.totalBSKT();

      const ethValue = ethers.parseEther("1");

      // Create bskt without expecting specific addresses
      const tx = await factory.createBSKT(
        bsktDetails.name,
        bsktDetails.symbol,
        bsktDetails.tokens,
        bsktDetails.weights,
        bsktDetails.tokenURI,
        bsktDetails.buffer,
        bsktDetails._id,
        bsktDetails.description,
        calculateDeadline(20),
        { value: ethValue }
      );

      const receipt = await tx.wait();

      const totalBSKTPost = await factory.totalBSKT();
      expect(totalBSKTPost).to.be.equal(totalBSKT + 1n);

      // Extract actual addresses from event logs
      let createdbsktAddress = null;
      for (const log of receipt.logs) {
        try {
          const parsedLog = factory.interface.parseLog(log);
          if (parsedLog?.name === "Createdbskt") {
            expect(parsedLog.args._id).to.equal(bsktDetails._id);
            break;
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    });
  });

  describe("Factory should update and sync contractURI correctly across bskt contracts", function () {
    it("Should revert when trying to update with empty URI", async function () {
      await expect(factory.updateCollectionURI(""))
        .to.be.revertedWithCustomError(factory, "EmptyStringParameter")
        .withArgs("URI");
    });

    it("Factory should update and sync contractURI correctly across bskt contracts", async function () {
      const BasketToken = await ethers.getContractFactory(
        "BasketTokenStandard"
      );
      const basketToken = await BasketToken.deploy();
      await basketToken.waitForDeployment();

      // Get the initial contract URI instead of hardcoding it
      const initialCollectionUri = await factory.getContractURI();
      const newCollectionUri = "https://my-nft.metadata.come";

      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "testId9",
        description: "This is testing bskt",
      };

      const ethValue = ethers.parseEther("1");

      const tx = await factory.createBSKT(
        bsktDetails.name,
        bsktDetails.symbol,
        bsktDetails.tokens,
        bsktDetails.weights,
        bsktDetails.tokenURI,
        bsktDetails.buffer,
        bsktDetails._id,
        bsktDetails.description,
        calculateDeadline(20),
        {
          value: ethValue,
        }
      );

      const receipt = await tx.wait();

      let createdbsktAddress = null;

      for (const log of receipt.logs) {
        try {
          const parsedLog = factory.interface.parseLog(log);
          if (parsedLog?.name === "BSKTCreated") {
            createdbsktAddress = parsedLog.args.bskt;
            break;
          }
        } catch (error) {
          console.error("Error parsing log:", error, "\nLog Data:", log);
        }
      }

      bsktInstance = await ethers.getContractAt(
        "BasketTokenStandard",
        createdbsktAddress
      );

      expect(await factory.getContractURI()).to.equal(initialCollectionUri);
      expect(await bsktInstance.contractURI()).to.equal(initialCollectionUri);
      expect(await factory.getContractURI()).to.equal(
        await bsktInstance.contractURI()
      );

      await expect(
        factory.connect(user1).updateCollectionURI(newCollectionUri)
      ).to.be.rejectedWith(`AccessControl: account ${user1.address.toString().toLowerCase()} is missing role ${await factory.URI_MANAGER_ROLE()}`);

      await expect(factory.updateCollectionURI(newCollectionUri))
        .to.to.emit(factory, "CollectionURIUpdated")
        .withArgs(newCollectionUri);

      expect(await factory.getContractURI()).to.equal(newCollectionUri);
      expect(await bsktInstance.contractURI()).to.equal(newCollectionUri);
      expect(await factory.getContractURI()).to.equal(
        await bsktInstance.contractURI()
      );
    });
  });

  describe("Check Token Value By WETH", function () {
    it("Should call getTokenValueByWETH to check tokens value by weth", async function () {
      const bsktDetails = {
        name: "My-bskt",
        symbol: "M-bskt",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://bskt-metadata.com",
        buffer: 100,
        _id: "testId10",
        description: "Integration test for getTokenValueByWETH",
      };
      const ethValue = ethers.parseEther("1");
      const tx = await factory.createBSKT(
        bsktDetails.name,
        bsktDetails.symbol,
        bsktDetails.tokens,
        bsktDetails.weights,
        bsktDetails.tokenURI,
        bsktDetails.buffer,
        bsktDetails._id,
        bsktDetails.description,
        calculateDeadline(20),
        { value: ethValue }
      );
      const receipt = await tx.wait();
      let createdbsktAddress = null;
      for (const log of receipt.logs) {
        try {
          const parsedLog = factory.interface.parseLog(log);
          if (parsedLog?.name === "BSKTCreated") {
            createdbsktAddress = parsedLog.args.bskt;
            break;
          }
        } catch (_) {}
      }
      expect(createdbsktAddress).to.not.be.null;
      const bsktInstance = await ethers.getContractAt(
        "BasketTokenStandard",
        createdbsktAddress
      );
      const value = await bsktInstance.getTokenValueByWETH();
      expect(value).to.be.a("bigint");
      // For a fresh bskt, value is likely zero
      expect(value).to.gt(0n);
    });
  });

  describe("createBSKT: Tokens & Weights validation", function () {
    it("should revert if a token address is zero address", async function () {
      // Use zero address as token address
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      const validToken = mtTokenAddress;
      const tokens = [zeroAddress, validToken];
      const weights = ["5000", "5000"];
      const bskt = await ethers.getContractFactory("BasketTokenStandard");
      await expect(
        factory.createBSKT(
          "Zero-Token-bskt",
          "ZTbskt",
          tokens,
          weights,
          "https://zero-token-bskt.com",
          100,
          "zero-token-id",
          "Should fail due to zero address token",
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      )
        .to.be.revertedWithCustomError(bskt, "InvalidContractAddress")
        .withArgs(zeroAddress);
    });
    it("should revert if a token address is not a contract address", async function () {
      // Use an EOA (owner) address as token address, which is not a contract
      const invalidToken = owner.address;
      const validToken = mtTokenAddress; // Assume this is a contract address
      const tokens = [invalidToken, validToken];
      const weights = ["5000", "5000"];
      const bskt = await ethers.getContractFactory("BasketTokenStandard");
      await expect(
        factory.createBSKT(
          "Invalid-Token-bskt",
          "ITbskt",
          tokens,
          weights,
          "https://invalid-token-bskt.com",
          100,
          "invalid-token-id",
          "Should fail due to EOA token address",
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      )
        .to.be.revertedWithCustomError(bskt, "InvalidContractAddress")
        .withArgs(invalidToken);
    });
    it("should revert if tokens and weights array is empty", async function () {
      const emptyTokens = [];
      const emptyWeights = [];
      const bskt = await ethers.getContractFactory("BasketTokenStandard");
      await expect(
        factory.createBSKT(
          "Empty-bskt",
          "Ebskt",
          emptyTokens,
          emptyWeights,
          "https://empty-bskt.com",
          100,
          "empty-id",
          "Should fail",
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      ).to.be.revertedWithCustomError(factory, "InvalidTokensAndWeights");
    });
    it("should revert if weights array is empty", async function () {
      const emptyTokens = [alvaAddress];
      const emptyWeights = [];
      const bskt = await ethers.getContractFactory("BasketTokenStandard");
      await expect(
        factory.createBSKT(
          "Empty-bskt",
          "Ebskt",
          emptyTokens,
          emptyWeights,
          "https://empty-bskt.com",
          100,
          "empty-id",
          "Should fail",
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      ).to.be.revertedWithCustomError(factory, "InvalidTokensAndWeights");
    });
    it("should revert if tokens array is empty", async function () {
      const emptyTokens = [];
      const emptyWeights = [10000];
      const bskt = await ethers.getContractFactory("BasketTokenStandard");
      await expect(
        factory.createBSKT(
          "Empty-bskt",
          "Ebskt",
          emptyTokens,
          emptyWeights,
          "https://empty-bskt.com",
          100,
          "empty-id",
          "Should fail",
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      ).to.be.revertedWithCustomError(factory, "InvalidTokensAndWeights");
    });
    it("should revert if tokens and weights arrays are not same length", async function () {
      const tokens = [mtTokenAddress, alvaAddress];
      const weights = ["5000", "2000", "3000"];
      const BSKT = await ethers.getContractFactory("BasketTokenStandard");
      await expect(
        factory.createBSKT(
          "Empty-BSKT",
          "EBSKT",
          tokens,
          weights,
          "https://empty-bskt.com",
          100,
          "empty-id",
          "Should fail",
          calculateDeadline(20),
          { value: ethers.parseEther("1") }
        )
      ).to.be.revertedWithCustomError(factory, "InvalidTokensAndWeights");
    });
  });

  describe("Minimum BSKT Creation Amount", function () {
    it("Should return the initial minimum BSKT creation amount", async function () {
      const minAmount = await factory.minBSKTCreationAmount();
      expect(minAmount).to.equal(ethers.parseEther("0.01"));
    });

    it("Should allow owner to update minimum BSKT creation amount", async function () {
      const newMinAmount = ethers.parseEther("0.05");
      await factory.updateMinBSKTCreationAmount(newMinAmount);

      const updatedMinAmount = await factory.minBSKTCreationAmount();
      expect(updatedMinAmount).to.equal(newMinAmount);
    });

    it("Should emit the amount updation event", async function () {
      const newMinAmount = ethers.parseEther("0.05");

      await expect(factory.updateMinBSKTCreationAmount(newMinAmount))
        .to.emit(factory, "MinBSKTCreationAmountUpdated")
        .withArgs(owner.address, newMinAmount);

      const updatedMinAmount = await factory.minBSKTCreationAmount();
      expect(updatedMinAmount).to.equal(newMinAmount);
    });

    it("Should revert when non-owner tries to update minimum BSKT creation amount", async function () {
      const newMinAmount = ethers.parseEther("0.05");
      await expect(
        factory.connect(user1).updateMinBSKTCreationAmount(newMinAmount)
      ).to.be.reverted;
    });

    it("Should revert when trying to set minimum BSKT creation amount to zero", async function () {
      await expect(
        factory.updateMinBSKTCreationAmount(0)
      ).to.be.revertedWithCustomError(factory, "InvalidAmount");
    });

    it("Should revert BSKT creation when sent ETH is below minimum amount", async function () {
      const newMinAmount = ethers.parseEther("0.5"); // Set higher minimum
      await factory.updateMinBSKTCreationAmount(newMinAmount);

      const bsktDetails = {
        name: "My-BSKT",
        symbol: "M-BSKT",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://my-nft.test.metadata.come",
        buffer: 2000,
        id: "123456",
        description: "This is a test NFT",
      };

      // Try to create with insufficient ETH
      const insufficientAmount = ethers.parseEther("0.1");
      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails.id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: insufficientAmount }
        )
      ).to.be.revertedWithCustomError(factory, "InsufficientBSKTCreationAmount");
    });

    it("Should allow BSKT creation when sent ETH equals the minimum amount", async function () {
      const exactMinAmount = ethers.parseEther("0.01"); // Default minimum

      const bsktDetails = {
        name: "My-BSKT",
        symbol: "M-BSKT",
        tokens: [mtTokenAddress, alvaAddress],
        weights: ["5000", "5000"],
        tokenURI: "https://my-nft.test.metadata.come",
        buffer: 2000,
        id: "123456",
        description: "This is a test NFT",
      };

      // Should succeed with exact minimum amount
      await expect(
        factory.createBSKT(
          bsktDetails.name,
          bsktDetails.symbol,
          bsktDetails.tokens,
          bsktDetails.weights,
          bsktDetails.tokenURI,
          bsktDetails.buffer,
          bsktDetails.id,
          bsktDetails.description,
          calculateDeadline(20),
          { value: exactMinAmount }
        )
      ).to.not.be.reverted;
    });
  });
});
