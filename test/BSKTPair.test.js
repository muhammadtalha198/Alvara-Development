const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { bigint } = require("hardhat/internal/core/params/argumentTypes");

describe.only("BasketTokenStandardPair", () => {
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

  let tokens;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5, user6] =
      await ethers.getSigners();

    const allDeployments = await deployments.fixture(["all-eth"]);

    wETH = await ethers.getContractAt("WETH", allDeployments["WETH"].address);
    bskt = await ethers.getContractAt(
      "BasketTokenStandard",
      allDeployments["BasketTokenStandard"].address
    );

    bsktPair = await ethers.getContractAt(
      "BasketTokenStandardPair",
      allDeployments["BasketTokenStandardPair"].address
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
    await wETH.mint(owner.address, ethers.parseEther("100000000000"));
    await wETH.approve(routerAddress, ethers.parseEther("100000000000"));
    await alva.approve(routerAddress, ethers.parseEther("100000000000"));
    await mtToken.approve(routerAddress, ethers.parseEther("100000000000"));

    await alva.setListingTimestamp("100");
  });

  describe("Initialize Values", function () {
    beforeEach(async function () {
      tokens = [wETHAddress, alvaAddress];
    });
    it("Contract should throw an error if token lenght is 0", async function () {
      await expect(
        bsktPair.initialize(factoryAddress, name, [])
      ).to.be.revertedWithCustomError(bsktPair, "InvalidToken");
    });

    it("Contract should throw an error if name is not provided ", async function () {
      await expect(
        bsktPair.initialize(factoryAddress, "", tokens)
      ).to.be.revertedWithCustomError(bsktPair, "EmptyStringParameter");
    });

    it("Name of LP token should be same as given", async function () {
      await bsktPair.initialize(factoryAddress, name, tokens);

      let tokenName = await bsktPair.name();
      expect(tokenName).to.be.equal(name + "-LP");
    });

    it("Symbol of LP token should be same as given", async function () {
      await bsktPair.initialize(factoryAddress, name, tokens);

      let tokenSymbol = await bsktPair.symbol();
      expect(tokenSymbol).to.be.equal(name + "-LP");
    });

    it("Total supply of LP token should be 0", async function () {
      await bsktPair.initialize(factoryAddress, name, tokens);

      let tokenSupply = await bsktPair.totalSupply();
      expect(tokenSupply).to.be.equal(0);
    });

    it("Owner should be the msg.sender", async function () {
      await bsktPair.initialize(factoryAddress, name, tokens);

      let tokenOwner = await bsktPair.owner();
      expect(tokenOwner).to.be.equal(owner.address);
    });

    it("Tokens should be added to list", async function () {
      await bsktPair.initialize(factoryAddress, name, tokens);

      let pairTokens = await bsktPair.getTokenList();

      for (var i = 0; i < pairTokens.length; i++) {
        expect(pairTokens[i]).to.be.equal(tokens[i]);
      }
    });

    it("reserves should be empty at initialize time", async function () {
      await bsktPair.initialize(factoryAddress, name, tokens);
      let tokenReserves = await bsktPair.getTokensReserve();

      for (var i = 0; i < tokenReserves.length; i++) {
        expect(tokenReserves[i]).to.be.equal(0n);
      }
    });
  });

  describe("Rebalance", function () {
    beforeEach(async function () {
      tokens = [wETHAddress, alvaAddress];
      await bsktPair.initialize(factoryAddress, name, tokens);
    });
    it("Only owner can call the transferTokensToOwner method", async function () {
      await expect(
        bsktPair.connect(user1).transferTokensToOwner()
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });

    it("Rebalance method should send all the tokens to owner", async function () {
      //transfer ownership to user1
      await bsktPair.transferOwnership(user1.address);

      const ownerAlvaBalance = await alva.balanceOf(user1.address);
      const ownerWethBalance = await wETH.balanceOf(user1.address);

      const bsktPairAddress = await bsktPair.getAddress();

      const sendTokenAmount = ethers.parseEther("1");

      expect(ownerAlvaBalance).to.be.equal(0);
      expect(ownerWethBalance).to.be.equal(0);

      await alva.transfer(bsktPairAddress, sendTokenAmount);
      await wETH.mint(bsktPairAddress, sendTokenAmount);

      await bsktPair.connect(user1).updateTokens([alvaAddress, wETHAddress]);

      const bsktAlvaBalanceAfterTransfer = await alva.balanceOf(bsktPairAddress);
      const bsktWethBalanceAfterTransfer = await wETH.balanceOf(bsktPairAddress);

      expect(bsktAlvaBalanceAfterTransfer).to.be.equal(sendTokenAmount);
      expect(bsktWethBalanceAfterTransfer).to.be.equal(sendTokenAmount);

      await bsktPair.connect(user1).transferTokensToOwner();

      const ownerAlvaBalanceAfterRebalance = await alva.balanceOf(
        user1.address
      );
      const ownerWethBalanceAfterRebalance = await wETH.balanceOf(
        user1.address
      );

      const bsktAlvaBalanceAfterRebalance = await alva.balanceOf(bsktPairAddress);
      const bsktWethBalanceAfterRebalance = await wETH.balanceOf(bsktPairAddress);

      expect(ownerAlvaBalanceAfterRebalance).to.be.equal(sendTokenAmount);
      expect(ownerWethBalanceAfterRebalance).to.be.equal(sendTokenAmount);
      expect(bsktAlvaBalanceAfterRebalance).to.be.equal(0);
      expect(bsktWethBalanceAfterRebalance).to.be.equal(0);
    });
  });

  describe("updateTokens", function () {
    beforeEach(async function () {
      tokens = [wETHAddress, alvaAddress];
      await bsktPair.initialize(factoryAddress, name, tokens);
    });

    it("Only owner can call the updateTokens method", async function () {
      const mtTokenAddress = await mtToken.getAddress();
      let newTokens = [wETHAddress, mtTokenAddress];
      await expect(
        bsktPair.connect(user1).updateTokens(newTokens)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Contract should throw an error if token are empty", async function () {
      await expect(bsktPair.updateTokens([])).to.be.revertedWithCustomError(
        bsktPair,
        "InvalidToken"
      );
    });

    it("Update tokens should update tokens and reserves", async function () {
      const sendTokenAmount = ethers.parseEther("100");

      await alva.transfer(bsktPairAddress, sendTokenAmount);
      await wETH.mint(bsktPairAddress, sendTokenAmount);

      const bsktAlvaBalanceAfterTransfer = await alva.balanceOf(bsktPairAddress);
      const bsktWethBalanceAfterTransfer = await wETH.balanceOf(bsktPairAddress);

      expect(bsktAlvaBalanceAfterTransfer).to.be.equal(sendTokenAmount);
      expect(bsktWethBalanceAfterTransfer).to.be.equal(sendTokenAmount);

      //Reserve should be 0, as not called update-tokens is not called
      const initialReserves = await bsktPair.getTokensReserve();
      expect(initialReserves.toString()).to.be.equal([0, 0].toString());

      await bsktPair.updateTokens(tokens);

      const bsktAlvaBalanceAfterRebalance = await alva.balanceOf(bsktPairAddress);
      const bsktWethBalanceAfterRebalance = await wETH.balanceOf(bsktPairAddress);

      expect(bsktAlvaBalanceAfterRebalance).to.be.equal(sendTokenAmount);
      expect(bsktWethBalanceAfterRebalance).to.be.equal(sendTokenAmount);

      const updatedTokens = await bsktPair.getTokenList();

      expect(updatedTokens.toString()).to.be.equal(tokens.toString());

      const updatedReserves = await bsktPair.getTokensReserve();
      const givenReserves = [sendTokenAmount, sendTokenAmount];

      expect(updatedReserves.toString()).to.be.equal(givenReserves.toString());
    });
  });

  describe("mint", function () {
    beforeEach(async function () {
      tokens = [wETHAddress, alvaAddress];

      await bsktPair.initialize(factoryAddress, name, tokens);
    });
    it("Only owner can mint tokens", async function () {
      await expect(
        bsktPair.connect(user1).mint(user1.address, [0])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Owner can't mint tokens to 0x address", async function () {
      await expect(bsktPair.mint(zeroAddress, [0])).to.be.revertedWithCustomError(
        bsktPair,
        "InvalidRecipient()"
      );
    });

    it("Contract should mint 1000 tokens if all okay for the first time", async function () {
      const userAddress = user1.address;

      //User balance should be zero
      const userInitialBalance = await bsktPair.balanceOf(userAddress);
      expect(userInitialBalance).to.be.equal(0);

      //Initial supply should be zero
      const LPTotalSupplyInitial = await bsktPair.totalSupply();
      expect(LPTotalSupplyInitial).to.be.equal(0);

      //Send some tokens to bsktPair
      let tokenAmount = ethers.parseEther("100");
      let tokenAmountSupply = ethers.parseEther("1000");
      await alva.transfer(bsktPairAddress, tokenAmount);
      await wETH.transfer(bsktPairAddress, tokenAmount);

      //mint tokens
      await bsktPair.mint(userAddress, [ethers.parseEther("100"), ethers.parseEther("100")]);

      //user should get 1000 LP tokens
      const userPostBalance = await bsktPair.balanceOf(userAddress);
      expect(userPostBalance).to.be.equal(tokenAmountSupply);

      //Supply should be 1000
      const LPTotalSupplyPost = await bsktPair.totalSupply();
      expect(LPTotalSupplyPost).to.be.equal(tokenAmountSupply);

      //Reserve should be updated
      const reserves = await bsktPair.getTokensReserve();
      const reservedWeth = reserves[0];
      expect(reservedWeth).to.be.equal(tokenAmount);

      const reservedAlva = reserves[1];
      expect(reservedAlva).to.be.equal(tokenAmount);
    });

    it("Contract should mint x tokens if all okay for the 2nd time", async function () {
      const userAddress = user1.address;

      //User balance should be zero
      const userInitialBalance = await bsktPair.balanceOf(userAddress);
      expect(userInitialBalance).to.be.equal(0);

      //Initial supply should be zero
      const LPTotalSupplyInitial = await bsktPair.totalSupply();
      expect(LPTotalSupplyInitial).to.be.equal(0);

      let tokenAmountInitalSupply = ethers.parseEther("1000");

      //Send some tokens to bsktPair
      let tokenAmount = ethers.parseEther("100");
      let tokenAmount2 = ethers.parseEther("200");

      await alva.transfer(bsktPairAddress, tokenAmount);
      await wETH.transfer(bsktPairAddress, tokenAmount);

      //mint tokens
      await bsktPair.mint(userAddress, [tokenAmount, tokenAmount]);

      //user should get 1000 LP tokens
      const userPostBalance = await bsktPair.balanceOf(userAddress);
      expect(userPostBalance).to.be.equal(tokenAmountInitalSupply);

      //Supply should be 1000
      const LPTotalSupplyPost = await bsktPair.totalSupply();
      expect(LPTotalSupplyPost).to.be.equal(tokenAmountInitalSupply);

      //Reserve should be updated
      const reserves = await bsktPair.getTokensReserve();
      const reservedWeth = reserves[0];
      expect(reservedWeth).to.be.equal(tokenAmount);

      const reservedAlva = reserves[1];
      expect(reservedAlva).to.be.equal(tokenAmount);

      //Send some Alva and weth tokens
      await wETH.mint(bsktPairAddress, tokenAmount2);
      await alva.transfer(bsktPairAddress, tokenAmount2);

      //mint new tokens
      await bsktPair.mint(userAddress, [tokenAmount2, tokenAmount2]);

      //check balance
      const userPostBalance2nd = await bsktPair.balanceOf(userAddress);
      expect(userPostBalance2nd).to.be.equal(ethers.parseEther("3000"));

      //Supply should be 1000
      const LPTotalSupplyPost2nd = await bsktPair.totalSupply();
      expect(LPTotalSupplyPost2nd).to.be.equal(ethers.parseEther("3000"));

      //Reserve should be updated
      const reserves2nd = await bsktPair.getTokensReserve();
      const reservedWeth2nd = reserves2nd[0];
      expect(reservedWeth2nd).to.be.equal(tokenAmount + tokenAmount2);

      const reservedAlva2nd = reserves2nd[1];
      expect(reservedAlva2nd).to.be.equal(tokenAmount + tokenAmount2);
    });
  });

  describe("calculateShareLP", function () {
    beforeEach(async function () {
      tokens = [wETHAddress, alvaAddress];
      await bsktPair.initialize(factoryAddress, name, tokens);
    });

    const addReserves = async (amount) => {
      //mint tokens
      await wETH.mint(bsktPairAddress, amount);
      const wethBalance = await wETH.balanceOf(bsktPairAddress);
      expect(wethBalance).to.be.equal(amount);
      await alva.transfer(bsktPairAddress, amount);
      const alvaBalance = await alva.balanceOf(bsktPairAddress);
      expect(alvaBalance).to.be.equal(amount);
    };

    const mintTokens = async (userAddress, amount) => {
      await addReserves(amount);

      //Fetch user balance
      const userInitialBalance = await bsktPair.balanceOf(userAddress);

      //Fetch initial supply
      const LPTotalSupplyInitial = await bsktPair.totalSupply();

      //mint tokens
      await bsktPair.mint(userAddress, [amount, amount]);

      //user balance should be updated
      const userPostBalance = await bsktPair.balanceOf(userAddress);
      expect(userPostBalance).to.be.greaterThan(userInitialBalance);

      //Supply should be updated
      const LPTotalSupplyPost = await bsktPair.totalSupply();
      expect(LPTotalSupplyPost).to.be.greaterThan(LPTotalSupplyInitial);
    };

    it("CalculateShareLP should should return 1000 if no reserves", async function () {
      let amountLp = await bsktPair.calculateShareLP(ethers.parseEther("100"));

      expect(amountLp).to.be.equal(ethers.parseEther("1000"));
    });

    it("CalculateShareLP should should return x tokens if there are reserves", async function () {
      const tokenAmount = ethers.parseEther("100");
      await mintTokens(user1.address, tokenAmount);

      const amountEth = ethers.parseEther("1");
      const amountLP = await bsktPair.calculateShareLP(amountEth);
      expect(amountLP).to.be.equal(ethers.parseEther("5"));
    });
  });

  describe("calculateShareETH", function () {
    beforeEach(async function () {
      tokens = [wETHAddress, alvaAddress];

      await bsktPair.initialize(factoryAddress, name, tokens);
    });

    const addReserves = async (amount) => {
      //mint tokens
      await wETH.mint(bsktPairAddress, amount);
      const wethBalance = await wETH.balanceOf(bsktPairAddress);
      expect(wethBalance).to.be.equal(amount);
      await alva.transfer(bsktPairAddress, amount);
      const alvaBalance = await alva.balanceOf(bsktPairAddress);
      expect(alvaBalance).to.be.equal(amount);
    };

    const mintTokens = async (userAddress, amount) => {
      await addReserves(amount);

      //Fetch user balance
      const userInitialBalance = await bsktPair.balanceOf(userAddress);

      //Fetch initial supply
      const LPTotalSupplyInitial = await bsktPair.totalSupply();

      //mint tokens
      await bsktPair.mint(userAddress, [amount, amount]);

      //user balance should be updated
      const userPostBalance = await bsktPair.balanceOf(userAddress);
      expect(userPostBalance).to.be.greaterThan(userInitialBalance);

      //Supply should be updated
      const LPTotalSupplyPost = await bsktPair.totalSupply();
      expect(LPTotalSupplyPost).to.be.greaterThan(LPTotalSupplyInitial);
    };

    it("calculateShareETH should should return 0 if no reserves/supply", async function () {
      let amountLp = await bsktPair.calculateShareETH(ethers.parseEther("100"));

      expect(amountLp).to.be.equal(0);
    });

    it("calculateShareETH should should return x value if there are reserves", async function () {
      const tokenAmount = ethers.parseEther("100");
      await mintTokens(user1.address, tokenAmount);

      const amountEth = ethers.parseEther("1");
      const amountLP = await bsktPair.calculateShareLP(amountEth);
      expect(amountLP).to.be.equal(ethers.parseEther("5"));

      //should return 1eth for 5 tokens
      const valueLP = await bsktPair.calculateShareETH(amountLP);
      expect(valueLP).to.be.equal(ethers.parseEther("1"));
    });
  });

  describe("calculateShareTokens", function () {
    beforeEach(async function () {
      tokens = [wETHAddress, alvaAddress];

      await bsktPair.initialize(factoryAddress, name, tokens);
    });

    const addReserves = async (amount) => {
      //mint tokens
      await wETH.mint(bsktPairAddress, amount);
      const wethBalance = await wETH.balanceOf(bsktPairAddress);
      expect(wethBalance).to.be.equal(amount);
      await alva.transfer(bsktPairAddress, amount);
      const alvaBalance = await alva.balanceOf(bsktPairAddress);
      expect(alvaBalance).to.be.equal(amount);
    };

    const mintTokens = async (userAddress, amount) => {
      await addReserves(amount);

      //Fetch user balance
      const userInitialBalance = await bsktPair.balanceOf(userAddress);

      //Fetch initial supply
      const LPTotalSupplyInitial = await bsktPair.totalSupply();

      //mint tokens
      await bsktPair.mint(userAddress, [amount, amount]);

      //user balance should be updated
      const userPostBalance = await bsktPair.balanceOf(userAddress);
      expect(userPostBalance).to.be.greaterThan(userInitialBalance);

      //Supply should be updated
      const LPTotalSupplyPost = await bsktPair.totalSupply();
      expect(LPTotalSupplyPost).to.be.greaterThan(LPTotalSupplyInitial);
    };

    it("calculateShareTokens should should return 0 if no reserves", async function () {
      let amountTokens = await bsktPair.calculateShareTokens(
        ethers.parseEther("100")
      );
      for (let i = 0; i < tokens; i++) {
        expect(amountTokens[i]).to.be.equal(0);
      }
    });

    it("calculateShareTokens should should return x value if there are reserves", async function () {
      const tokenAmount = ethers.parseEther("100");
      await mintTokens(user1.address, tokenAmount);

      const amountEth = ethers.parseEther("1");
      const amountLP = await bsktPair.calculateShareLP(amountEth);
      expect(amountLP).to.be.equal(ethers.parseEther("5"));

      //should return 1eth for 5 tokens
      const valueLP = await bsktPair.calculateShareTokens(amountLP);
      for (let i = 0; i < tokens; i++) {
        expect(valueLP[i]).to.be.equal(ethers.parseEther("0.5"));
      }
    });
  });

  describe("getTokenAndUserBal", function () {
    beforeEach(async function () {
      tokens = [wETHAddress, alvaAddress];

      await bsktPair.initialize(factoryAddress, name, tokens);
    });

    const addReserves = async (amount) => {
      //mint tokens
      await wETH.mint(bsktPairAddress, amount);
      const wethBalance = await wETH.balanceOf(bsktPairAddress);
      expect(wethBalance).to.be.equal(amount);
      await alva.transfer(bsktPairAddress, amount);
      const alvaBalance = await alva.balanceOf(bsktPairAddress);
      expect(alvaBalance).to.be.equal(amount);
    };

    const mintTokens = async (userAddress, amount) => {
      await addReserves(amount);

      //Fetch user balance
      const userInitialBalance = await bsktPair.balanceOf(userAddress);

      //Fetch initial supply
      const LPTotalSupplyInitial = await bsktPair.totalSupply();

      //mint tokens
      await bsktPair.mint(userAddress, [amount, amount]);

      //user balance should be updated
      const userPostBalance = await bsktPair.balanceOf(userAddress);
      expect(userPostBalance).to.be.greaterThan(userInitialBalance);

      //Supply should be updated
      const LPTotalSupplyPost = await bsktPair.totalSupply();
      expect(LPTotalSupplyPost).to.be.greaterThan(LPTotalSupplyInitial);
    };

    it("getTokenAndUserBal should return 0 if no reserves", async function () {
      const userAddress = user1.address;
      const userValues = await bsktPair.getTokenAndUserBal(userAddress);
      expect(userValues[0][0]).to.be.equal(0);
      expect(userValues[0][1]).to.be.equal(0);
      expect(userValues[1]).to.be.equal(0);
      expect(userValues[2]).to.be.equal(0);
    });

    it("calculateShareTokens should should return x value if there are reserves", async function () {
      const tokenAmount = ethers.parseEther("100");
      await mintTokens(user1.address, tokenAmount);

      const userAddress = user1.address;
      const userValues = await bsktPair.getTokenAndUserBal(userAddress);

      expect(userValues[0][0]).to.be.equal(ethers.parseEther("100"));
      expect(userValues[0][1]).to.be.equal(ethers.parseEther("100"));
      expect(userValues[1]).to.be.equal(ethers.parseEther("1000"));
      expect(userValues[2]).to.be.equal(ethers.parseEther("1000"));
    });
  });

  describe("burn", function () {
    beforeEach(async function () {
      tokens = [wETHAddress, alvaAddress];

      await bsktPair.initialize(factoryAddress, name, tokens);
    });

    const addReserves = async (amount) => {
      //mint tokens
      await wETH.mint(bsktPairAddress, amount);
      const wethBalance = await wETH.balanceOf(bsktPairAddress);
      expect(wethBalance).to.be.equal(amount);
      await alva.transfer(bsktPairAddress, amount);
      const alvaBalance = await alva.balanceOf(bsktPairAddress);
      expect(alvaBalance).to.be.equal(amount);
    };

    const mintTokens = async (userAddress, amount) => {
      await addReserves(amount);

      //Fetch user balance
      const userInitialBalance = await bsktPair.balanceOf(userAddress);

      //Fetch initial supply
      const LPTotalSupplyInitial = await bsktPair.totalSupply();

      //mint tokens
      await bsktPair.mint(userAddress, [amount, amount]);

      //user balance should be updated
      const userPostBalance = await bsktPair.balanceOf(userAddress);
      expect(userPostBalance).to.be.greaterThan(userInitialBalance);

      //Supply should be updated
      const LPTotalSupplyPost = await bsktPair.totalSupply();
      expect(LPTotalSupplyPost).to.be.greaterThan(LPTotalSupplyInitial);
    };

    it("Only owner can call burn", async function () {
      await expect(
        bsktPair.connect(user1).burn(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("burn should throw an error if no reserves", async function () {
      await expect(bsktPair.burn(user1.address)).to.be.revertedWithCustomError(
        bsktPair,
        "InsufficientLiquidity()"
      );
    });

    it("burn should throw an error if 0x address is given", async function () {
      await expect(bsktPair.burn(zeroAddress)).to.be.revertedWithCustomError(
        bsktPair,
        "InvalidRecipient()"
      );
    });

    it("burn should throw an error contract doesn't have tokens", async function () {
      const userAddress = user1.address;

      //User initial Balance
      let userAlvaBalance = await alva.balanceOf(userAddress);
      let userWethBalance = await wETH.balanceOf(userAddress);

      expect(userAlvaBalance).to.be.equal(0);
      expect(userWethBalance).to.be.equal(0);

      const tokenAmount = ethers.parseEther("100");
      await mintTokens(userAddress, tokenAmount);

      //User Balance mint
      let userAlvaBalanceAfterMint = await alva.balanceOf(userAddress);
      let userWethBalanceAfterMint = await wETH.balanceOf(userAddress);
      expect(userAlvaBalanceAfterMint).to.be.equal(0);
      expect(userWethBalanceAfterMint).to.be.equal(0);

      await expect(bsktPair.burn(userAddress)).to.be.revertedWithCustomError(
        bsktPair,
        "InsufficientLiquidity()"
      );
    });

    it("burn should update reserves and burn tokens", async function () {
      const userAddress = user1.address;

      //User initial Balance
      let userAlvaBalance = await alva.balanceOf(userAddress);
      let userWethBalance = await wETH.balanceOf(userAddress);

      expect(userAlvaBalance).to.be.equal(0);
      expect(userWethBalance).to.be.equal(0);

      const tokenAmount = ethers.parseEther("100");
      await mintTokens(userAddress, tokenAmount);

      //balance bfore transfer
      let balanceLPInitialbsktpair = await bsktPair.balanceOf(bsktPairAddress);
      expect(balanceLPInitialbsktpair).to.be.equal(0);

      await bsktPair
        .connect(user1)
        .transfer(bsktPairAddress, ethers.parseEther("1000"));

      let balanceLPbsktpairPost = await bsktPair.balanceOf(bsktPairAddress);
      expect(balanceLPbsktpairPost).to.be.equal(ethers.parseEther("1000"));

      //User Balance mint
      let userAlvaBalanceAfterMint = await alva.balanceOf(userAddress);
      let userWethBalanceAfterMint = await wETH.balanceOf(userAddress);
      expect(userAlvaBalanceAfterMint).to.be.equal(0);
      expect(userWethBalanceAfterMint).to.be.equal(0);

      await bsktPair.burn(userAddress);

      //User sould get the amount of tokens
      //User Balance burn
      let userAlvaBalanceAfterBurn = await alva.balanceOf(userAddress);
      let userWethBalanceAfterBurn = await wETH.balanceOf(userAddress);
      expect(userAlvaBalanceAfterBurn).to.be.equal(tokenAmount);
      expect(userWethBalanceAfterBurn).to.be.equal(tokenAmount);
    });
  });
});
