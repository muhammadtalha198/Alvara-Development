const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

describe.only("BSKT", () => {
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
  // Calculate Deadline
  function calculateDeadline(minutes = 20) {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const buffer = minutes * 60; // Convert minutes to seconds
    return currentTime + buffer;
  }
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
    const weights = ["5000", "5000"];

    beforeEach(async function () {
      const wETHAddress = await wETH.getAddress();
      const alvaAddress = await alva.getAddress();
      tokens = [wETHAddress, alvaAddress];
    });
    it("Name of BSKT should be same as given", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const bsktName = await bskt.name();
      expect(bsktName).to.be.equal(name);
    });

    it("Symbol of BSKT should be same as given", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const bsktSymbol = await bskt.symbol();
      expect(bsktSymbol).to.be.equal(args.symbol);
    });

    it("Owner of BSKT should be same as given", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const bsktOwner = await bskt.ownerOf(0);
      expect(bsktOwner).to.be.equal(args.owner);
    });

    it("Factory of BSKT should be same as given", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const bsktFactory = await bskt.factory();
      expect(bsktFactory).to.be.equal(args.factory);
    });
    it("Tokens of BSKT should be same as given", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const tokenLength = await bskt.totalTokens();
      expect(tokenLength).to.be.equal(tokens.length);

      for (let i = 0; i < tokens.length; i++) {
        const bsktTokenDetails = await bskt["getTokenDetails(uint256)"](i);
        expect(bsktTokenDetails.token).to.be.equal(tokens[i]);
        expect(bsktTokenDetails.weight).to.be.equal(weights[i]);
      }
    });

    it("TokenURI of BSKT should be same as given", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const bsktTokenUri = await bskt.tokenURI(0);
      expect(bsktTokenUri).to.be.equal(tokenURI);
    });
    it("Pair of BSKT should be same as given", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const bsktLPTokenAddress = await bskt.bsktPair();
      expect(bsktLPTokenAddress).to.be.equal(args.bsktPair);
    });

    it("Id of BSKT should be same as given", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const bsktId = await bskt.id();
      expect(bsktId).to.be.equal(args.name);
    });

    it("Description of BSKT should be same as given", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const bsktDescription = await bskt.description();
      expect(bsktDescription).to.be.equal(description);
    });

    // it("Contract should throw error if name of bskt is not given", async function () {
    //   const args = {
    //     name,
    //     symbol: name + "-symbol",
    //     owner: owner.address,
    //     factory: factoryAddress,
    //     tokens,
    //     weights,
    //     bsktPair: bsktPairAddress,
    //     tokenURI,
    //     description,
    //   };

    //   await expect(
    //     bskt.initialize(
    //       "",
    //       args.symbol,
    //       args.owner,
    //       args.factory,
    //       args.tokens,
    //       args.weights,
    //       args.bsktPair,
    //       args.tokenURI,
    //       args.name,
    //       args.description
    //     )
    //   ).to.be.revertedWithCustomError(bskt, "EmptyStringParameter");
    // });
    // it("Contract should throw error if symbol of bskt is not given", async function () {
    //   const args = {
    //     name,
    //     symbol: name + "-symbol",
    //     owner: owner.address,
    //     factory: factoryAddress,
    //     tokens,
    //     weights,
    //     bsktPair: bsktPairAddress,
    //     tokenURI,
    //     description,
    //   };

    //   await expect(
    //     bskt.initialize(
    //       args.name,
    //       "",
    //       args.owner,
    //       args.factory,
    //       args.tokens,
    //       args.weights,
    //       args.bsktPair,
    //       args.tokenURI,
    //       args.name,
    //       args.description
    //     )
    //   ).to.be.revertedWithCustomError(bskt, "EmptyStringParameter");
    // });
    // it("Contract should throw error if tokenUri of bskt is not given", async function () {
    //   const args = {
    //     name,
    //     symbol: name + "-symbol",
    //     owner: owner.address,
    //     factory: factoryAddress,
    //     tokens,
    //     weights,
    //     bsktPair: bsktPairAddress,
    //     tokenURI,
    //     description,
    //   };

    //   await expect(
    //     bskt.initialize(
    //       args.name,
    //       args.symbol,
    //       args.owner,
    //       args.factory,
    //       args.tokens,
    //       args.weights,
    //       args.bsktPair,
    //       "",
    //       args.name,
    //       args.description
    //     )
    //   ).to.be.revertedWithCustomError(bskt, "EmptyStringParameter");
    // });
    // it("Contract should throw error if id of bskt is not given", async function () {
    //   const args = {
    //     name,
    //     symbol: name + "-symbol",
    //     owner: owner.address,
    //     factory: factoryAddress,
    //     tokens,
    //     weights,
    //     bsktPair: bsktPairAddress,
    //     tokenURI,
    //     description,
    //   };

    //   await expect(
    //     bskt.initialize(
    //       args.name,
    //       args.symbol,
    //       args.owner,
    //       args.factory,
    //       args.tokens,
    //       args.weights,
    //       args.bsktPair,
    //       args.tokenURI,
    //       "",
    //       args.description
    //     )
    //   ).to.be.revertedWithCustomError(bskt, "EmptyStringParameter");
    // });

    it("Contract should throw error if length of token and weight is not same", async function () {
      const invalidWeights = ["5000"];
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights: invalidWeights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await expect(
        bskt.initialize(
          args.name,
          args.symbol,
          args.owner,
          args.factory,
          args.tokens,
          args.weights,
          args.bsktPair,
          args.tokenURI,
          args.name,
          args.description
        )
      ).to.be.revertedWithCustomError(bskt, "InvalidLength");
    });

    it("Contract should throw error if sum of weight is not 100%", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights: ["4000", "4000"],
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await expect(
        bskt.initialize(
          args.name,
          args.symbol,
          args.owner,
          args.factory,
          args.tokens,
          args.weights,
          args.bsktPair,
          args.tokenURI,
          args.name,
          args.description
        )
      ).to.be.revertedWithCustomError(bskt, "InvalidWeight");
    });

    it("Contract should throw error if Alva is not added", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens: [wETHAddress, mtTokenAddress],
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await expect(
        bskt.initialize(
          args.name,
          args.symbol,
          args.owner,
          args.factory,
          args.tokens,
          args.weights,
          args.bsktPair,
          args.tokenURI,
          args.name,
          args.description
        )
      ).to.be.revertedWithCustomError(bskt, "NoAlvaTokenIncluded");
    });

    it("Contract should throw error if Alva perecentage is less then 5%", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights: ["9800", "200"],
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await expect(
        bskt.initialize(
          args.name,
          args.symbol,
          args.owner,
          args.factory,
          args.tokens,
          args.weights,
          args.bsktPair,
          args.tokenURI,
          args.name,
          args.description
        )
      ).to.be.revertedWithCustomError(bskt, "InsufficientAlvaPercentage");
    });

    it("Contract should throw error if duplicate tokens are added", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens: [alvaAddress, alvaAddress],
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await expect(
        bskt.initialize(
          args.name,
          args.symbol,
          args.owner,
          args.factory,
          args.tokens,
          args.weights,
          args.bsktPair,
          args.tokenURI,
          args.name,
          args.description
        )
      ).to.be.revertedWithCustomError(bskt, "DuplicateToken");
    });

    it("Contract should throw error if weight of any token is 0", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights: ["0", "10000"],
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await expect(
        bskt.initialize(
          args.name,
          args.symbol,
          args.owner,
          args.factory,
          args.tokens,
          args.weights,
          args.bsktPair,
          args.tokenURI,
          args.name,
          args.description
        )
      ).to.be.revertedWithCustomError(bskt, "ZeroTokenWeight");
    });

    it("Initialize should mint 0 token to owner address", async function () {
      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      const bsktOwner = await bskt.ownerOf(0);
      expect(bsktOwner).to.be.equal(args.owner);
    });
  });

  describe("Contribute", function () {
    const weights = ["5000", "5000"];

    beforeEach(async function () {
      tokens = [mtTokenAddress, alvaAddress];

      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      await bsktPair.initialize(args.factory, args.name, args.tokens);
    });
    it("Contract should throw an error if buffer is 0%", async function () {
      const buffer = 0n;
      await expect(
        bskt.contribute(buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidBuffer");
    });

    it("Contract should throw an error if buffer is more then 5%", async function () {
      const buffer = 5001n;
      await expect(
        bskt.contribute(buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidBuffer");
    });

    it("Contract should throw an error if 0 eth sent", async function () {
      const buffer = 2000n;
      await expect(
        bskt.contribute(buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "ZeroContributionAmount");
    });

    it("On contribute contract should send tokens to bskt-pair contract", async function () {
      const buffer = 2000n;
      const ethValue = ethers.parseEther("1");
      // Platform fee is 0.5% (50 basis points)
      const platformFeePercent = 50n; // 0.5% = 50 basis points
      const feeDenominator = 10000n;

      const feeAmount = (ethValue * platformFeePercent) / feeDenominator;
      const netContributionAmount = ethValue - feeAmount;
      const halfNetAmount = netContributionAmount / 2n;

      const ownerOfBSKTPair = await bsktPair.owner();
      // console.log("ownerOfBSKTPair: ", ownerOfBSKTPair)

      const ownerAddress = owner.address;
      // console.log("ownerAddress: ", ownerAddress)

      await bsktPair.transferOwnership(bsktAddress);

      await expect(
        bskt.contribute(buffer, calculateDeadline(20), { value: ethValue })
      )
        .to.emit(bskt, "ContributedToBSKT")
        .withArgs(bsktAddress, owner.address, ethValue);

      const contractAlvaBalance = await alva.balanceOf(bsktPairAddress);
      expect(contractAlvaBalance).to.be.equal(halfNetAmount);

      const contractTokenBalance = await mtToken.balanceOf(bsktPairAddress);
      expect(contractTokenBalance).to.be.equal(halfNetAmount);
    });

    it("On contribute contract should send 1000 tokens to user", async function () {
      const buffer = 2000n;
      const ethValue = ethers.parseEther("1");

      const ownerAddress = owner.address;

      await bsktPair.transferOwnership(bsktAddress);

      await expect(
        bskt.contribute(buffer, calculateDeadline(20), { value: ethValue })
      )
        .to.emit(bskt, "ContributedToBSKT")
        .withArgs(bsktAddress, ownerAddress, ethValue);

      const userLPBalance = await bsktPair.balanceOf(ownerAddress);
      expect(userLPBalance).to.be.equal(ethers.parseEther("1000"));
    });
  });

  // describe("Withdraw", function () {
  //   const weights = ["5000", "5000"];

  //   beforeEach(async function () {
  //     tokens = [mtTokenAddress, alvaAddress];

  //     const args = {
  //       name,
  //       symbol: name + "-symbol",
  //       owner: owner.address,
  //       factory: factoryAddress,
  //       tokens,
  //       weights,
  //       bsktPair: bsktPairAddress,
  //       tokenURI,
  //       description,
  //     };

  //     await bskt.initialize(
  //       args.name,
  //       args.symbol,
  //       args.owner,
  //       args.factory,
  //       args.tokens,
  //       args.weights,
  //       args.bsktPair,
  //       args.tokenURI,
  //       args.name,
  //       args.description
  //     );

  //     await bsktPair.initialize(args.factory, args.name, args.tokens);

  //     const buffer = 2000n;
  //     const ethValue = ethers.parseEther("1");

  //     // await mtToken.transfer(bsktPairAddress, ethers.parseEther("0.5"));
  //     // await alva.transfer(bsktPairAddress, ethers.parseEther("0.5"));
  //     // await bsktPair.mint(owner.address);
  //     await bsktPair.transferOwnership(bsktAddress);

  //     await expect(
  //       bskt
  //         .connect(user1)
  //         .contribute(buffer, calculateDeadline(20), { value: ethValue })
  //     )
  //       .to.emit(bskt, "ContributedToBSKT")
  //       .withArgs(bsktAddress, user1.address, ethValue);
  //   });
  //   // Commented out due to withdraw function being made private
  //   /* 
  //   it("Contract should throw an error if amount is not allowed", async function () {
  //     const userBalance = await bsktPair.balanceOf(user1.address);

  //     await expect(
  //       bskt.connect(user1).withdraw(userBalance, 100, calculateDeadline(20))
  //     ).to.be.reverted;
  //   });

  //   it("Contract should throw an error if user has no liquidity", async function () {
  //     const userBalance = await bsktPair.balanceOf(user1.address);

  //     await bsktPair.connect(user2).approve(bsktAddress, userBalance);
  //     await expect(
  //       bskt.connect(user2).withdraw(userBalance, 100, calculateDeadline(20))
  //     ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  //   });

  //   it("Contract should throw an error if 0 liquidity is given", async function () {
  //     await expect(
  //       bskt.connect(user1).withdraw("0", 100, calculateDeadline(20))
  //     ).to.be.revertedWithCustomError(bskt, "InvalidWithdrawalAmount");
  //   });
  //   */

  //   it("Contract should burn LP tokens if all okay", async function () {
  //     const userBalance = await bsktPair.balanceOf(user1.address);

  //     await bsktPair.connect(user1).approve(bsktAddress, userBalance);

  //     // Apply the withdrawal fee percentage - 0.5% fee
  //     const withdrawFeePercent = 50n; // 0.5% = 50 basis points
  //     const feeDenominator = 10000n;

  //     // Calculate amounts after fee
  //     const calculateAmountsWithFee = async (lpAmount) => {
  //       const baseAmounts = await bsktPair.calculateShareTokens(lpAmount);
  //       return baseAmounts.map(
  //         (amount) => amount - (amount * withdrawFeePercent) / feeDenominator
  //       );
  //     };

  //     const amountsWithFee = await calculateAmountsWithFee(userBalance);

  //     // Get feeCollector and expected fee
  //     const platformFeeConfig = await factory.getPlatformFeeConfig();
  //     const feeCollector = platformFeeConfig[3];
  //     const feeLiquidity = (userBalance * withdrawFeePercent) / feeDenominator;

  //     // Record feeCollector balance before
  //     const feeCollectorBalanceBefore = await ethers.provider.getBalance(
  //       feeCollector
  //     );

  //     // Token supply before
  //     const tokenSupplyInitial = await bsktPair.totalSupply();

  //     const tx = await bskt
  //       .connect(user1)
  //       .withdrawETH(userBalance, 100, calculateDeadline(20));
  //     const receipt = await tx.wait();

  //     // Token supply after
  //     const tokenSupplyPost = await bsktPair.totalSupply();
  //     expect(tokenSupplyPost).to.be.equal(tokenSupplyInitial - userBalance);

  //     // Confirm LP tokens burned
  //     const userBalancePost = await bsktPair.balanceOf(user1.address);
  //     expect(userBalancePost).to.equal(0);

  //     // Compute actual fee received in ETH
  //     const feeCollectorBalanceAfter = await ethers.provider.getBalance(
  //       feeCollector
  //     );
  //     const actualFeeReceived =
  //       feeCollectorBalanceAfter - feeCollectorBalanceBefore;

  //     // Assert feeCollector received close to expected ETH fee
  //     expect(actualFeeReceived).to.be.closeTo(
  //       actualFeeReceived, // We can compare this directly since _tokensToEth returns it
  //       ethers.parseEther("0.001")
  //     );

  //     // Find PlatformFeeDeducted event
  //     const platformFeeEvent = receipt.logs.find(
  //       (log) => log.fragment?.name === "PlatformFeeDeducted"
  //     );
  //     expect(platformFeeEvent).to.not.be.undefined;

  //     const [ethAmount, feeRate, feeRecipient, context] = platformFeeEvent.args;

  //     // Cross check event data
  //     expect(ethAmount).to.be.closeTo(
  //       actualFeeReceived,
  //       ethers.parseEther("0.001")
  //     );
  //     expect(feeRate).to.equal(withdrawFeePercent);
  //     expect(feeRecipient).to.equal(feeCollector);
  //     expect(context).to.equal("withdrawETH");

  //     // // Also check WithdrawnFromBSKT
  //     // await expect(tx)
  //     //   .to.emit(bskt, "WithdrawnFromBSKT")
  //     //   .withArgs(bsktAddress, user1.address, tokens, amountsWithFee);
  //   });

  //   it("Contract should burn only given LP tokens if all okay", async function () {
  //     const userBalance = await bsktPair.balanceOf(user1.address);
  //     await bsktPair.connect(user1).approve(bsktAddress, userBalance);

  //     // Setup: get platform fee config
  //     const [, , withdrawalFee, feeCollector] =
  //       await factory.getPlatformFeeConfig();
  //     const feeDenominator = 10000n;

  //     // Calculate expected token distributions
  //     const calculateAmounts = async (lpAmount) => {
  //       const baseAmounts = await bsktPair.calculateShareTokens(lpAmount);
  //       return baseAmounts;
  //     };

  //     const baseAmounts = await calculateAmounts(userBalance);
  //     const feeAmounts = baseAmounts.map(
  //       (amount) => (amount * BigInt(withdrawalFee)) / feeDenominator
  //     );
  //     const userAmounts = baseAmounts.map(
  //       (amount, i) => amount - feeAmounts[i]
  //     );

  //     // Track initial balances
  //     const initialMtBalance = await mtToken.balanceOf(user1.address);
  //     const initialAlvaBalance = await alva.balanceOf(user1.address);
  //     const initialEthBalanceFeeCollector = await ethers.provider.getBalance(
  //       feeCollector
  //     );

  //     const tokenSupplyInitial = await bsktPair.totalSupply();

  //     const tx = await bskt
  //       .connect(user1)
  //       .withdrawETH(userBalance, 100, calculateDeadline(20));
  //     const receipt = await tx.wait();

  //     // Parse platform fee event
  //     const feeEvent = receipt.logs.find(
  //       (log) => log.fragment?.name === "PlatformFeeDeducted"
  //     );
  //     expect(feeEvent).to.not.be.undefined;
  //     const [ethFeeAmount] = feeEvent.args;

  //     // Check LP burn
  //     const userBalancePost = await bsktPair.balanceOf(user1.address);
  //     expect(userBalancePost).to.equal(0);

  //     const tokenSupplyPost = await bsktPair.totalSupply();
  //     expect(tokenSupplyPost).to.equal(tokenSupplyInitial - userBalance);

  //     // Check user token balances
  //     const finalMtBalance = await mtToken.balanceOf(user1.address);
  //     const finalAlvaBalance = await alva.balanceOf(user1.address);

  //     expect(finalMtBalance).to.equal(initialMtBalance + userAmounts[0]);
  //     expect(finalAlvaBalance).to.equal(initialAlvaBalance + userAmounts[1]);

  //     // Check feeCollector's ETH increased
  //     const finalEthBalanceFeeCollector = await ethers.provider.getBalance(
  //       feeCollector
  //     );
  //     expect(finalEthBalanceFeeCollector).to.be.equal(
  //       initialEthBalanceFeeCollector + ethFeeAmount
  //     );
  //   });

  //   it("Contract should burn only given LP tokens if all okay", async function () {
  //     const halfBalance = (await bsktPair.balanceOf(user1.address)) / 2n;
  //     await bsktPair.connect(user1).approve(bsktAddress, halfBalance);

  //     // Fee info from factory
  //     const { withdrawalFee, feeCollector } = await factory
  //       .getPlatformFeeConfig()
  //       .then((res) => ({
  //         withdrawalFee: res[2],
  //         feeCollector: res[3],
  //       }));

  //     const withdrawFeePercent = BigInt(withdrawalFee); // e.g., 50 for 0.5%
  //     const feeDenominator = 10000n;

  //     const feeLiquidity = (halfBalance * withdrawFeePercent) / feeDenominator;
  //     const userLiquidity = halfBalance - feeLiquidity;

  //     const feeCollectorETHBefore = await ethers.provider.getBalance(
  //       feeCollector
  //     );
  //     const userMTTokenBefore = await mtToken.balanceOf(user1.address);
  //     const userAlvaBefore = await alva.balanceOf(user1.address);

  //     const feeAmounts = await bsktPair.calculateShareTokens(feeLiquidity);
  //     const userAmounts = await bsktPair.calculateShareTokens(userLiquidity);

  //     const expectedMT = userMTTokenBefore + userAmounts[0];
  //     const expectedALVA = userAlvaBefore + userAmounts[1];

  //     const tx = await bskt
  //       .connect(user1)
  //       .withdrawETH(halfBalance, 100, calculateDeadline(20));
  //     const receipt = await tx.wait();

  //     // Check WithdrawnFromBSKT event
  //     const withdrawnEvent = receipt.logs.find(
  //       (l) => l.fragment?.name === "WithdrawnFromBSKT"
  //     );
  //     expect(withdrawnEvent.args.bskt).to.equal(bsktAddress);
  //     expect(withdrawnEvent.args.tokens).to.eql([mtTokenAddress, alvaAddress]);
  //     expect(withdrawnEvent.args.amounts).to.eql(userAmounts);

  //     // Check PlatformFeeDeducted event
  //     const platformFeeEvent = receipt.logs.find(
  //       (l) => l.fragment?.name === "PlatformFeeDeducted"
  //     );
  //     expect(platformFeeEvent.args.feePercent).to.equal(withdrawFeePercent);
  //     expect(platformFeeEvent.args.feeCollector).to.equal(feeCollector);
  //     expect(platformFeeEvent.args.action).to.equal("withdrawTokens");

  //     // Check token balances updated correctly
  //     const userMTTokenAfter = await mtToken.balanceOf(user1.address);
  //     const userAlvaAfter = await alva.balanceOf(user1.address);
  //     const feeCollectorETHAfter = await ethers.provider.getBalance(
  //       feeCollector
  //     );

  //     expect(userMTTokenAfter).to.equal(expectedMT);
  //     expect(userAlvaAfter).to.equal(expectedALVA);
  //     expect(feeCollectorETHAfter).to.be.gt(feeCollectorETHBefore);

  //     // Check remaining LP balance
  //     const remainingBalance = await bsktPair.balanceOf(user1.address);
  //     expect(remainingBalance).to.equal(halfBalance);
  //   });

  //   it("Contract should send tokens from bskt-pair to sender if all okay", async function () {
  //     const userBalance = await bsktPair.balanceOf(user1.address);
  //     await bsktPair.connect(user1).approve(bsktAddress, userBalance);

  //     // Apply the withdrawal fee percentage - 0.5% fee
  //     const withdrawFeePercent = 50n; // 0.5% = 50 basis points
  //     const feeDenominator = 10000n;

  //     // Calculate amounts after fee
  //     const calculateAmountsWithFee = async (lpAmount) => {
  //       const baseAmounts = await bsktPair.calculateShareTokens(lpAmount);
  //       // Get the withdrawal fee from the factory
  //       const [, , withdrawalFee] = await factory.getPlatformFeeConfig();
  //       const localWithdrawFeePercent = BigInt(withdrawalFee);

  //       return baseAmounts.map(
  //         (amount) =>
  //           amount - (amount * localWithdrawFeePercent) / feeDenominator
  //       );
  //     };

  //     const amountsWithFee = await calculateAmountsWithFee(userBalance);

  //     // Get feeCollector
  //     const [, , , feeCollector] = await factory.getPlatformFeeConfig();
  //     const feeCollectorBalanceBefore = await ethers.provider.getBalance(
  //       feeCollector
  //     );

  //     // Record initial balances
  //     const userAlvaBalanceBefore = await alva.balanceOf(user1.address);
  //     const userMTTokenBalanceBefore = await mtToken.balanceOf(user1.address);

  //     // Perform the withdrawal
  //     await expect(
  //       bskt.connect(user1).withdraw(userBalance, 100, calculateDeadline(20))
  //     )
  //       .to.be.emit(bskt, "WithdrawnFromBSKT")
  //       .withArgs(bsktAddress, user1.address, tokens, amountsWithFee);

  //     // Check LP tokens were burned
  //     const userLPBalanceAfter = await bsktPair.balanceOf(user1.address);
  //     expect(userLPBalanceAfter).to.be.equal(0);

  //     // Check token balances were updated
  //     const userAlvaBalanceAfter = await alva.balanceOf(user1.address);
  //     const userMTTokenBalanceAfter = await mtToken.balanceOf(user1.address);
  //     const bsktPairAlvaBalanceAfter = await alva.balanceOf(bsktPairAddress);
  //     const bsktPairMTTokenBalanceAfter = await mtToken.balanceOf(
  //       bsktPairAddress
  //     );

  //     // Verify user received the correct amount of tokens
  //     expect(userMTTokenBalanceAfter).to.be.equal(
  //       userMTTokenBalanceBefore + amountsWithFee[0]
  //     );
  //     expect(userAlvaBalanceAfter).to.be.equal(
  //       userAlvaBalanceBefore + amountsWithFee[1]
  //     );

  //     // Verify BSKT pair sent the correct amount of tokens
  //     expect(bsktPairMTTokenBalanceAfter).to.be.equal(0);
  //     expect(bsktPairAlvaBalanceAfter).to.be.equal(0);

  //     // Verify feeCollector received ETH
  //     const feeCollectorBalanceAfter = await ethers.provider.getBalance(
  //       feeCollector
  //     );
  //     // Calculate the expected ETH fee amount
  //     // First get the total amount from token amounts
  //     const totalAmount = amountsWithFee.reduce(
  //       (sum, amount) => sum + amount,
  //       0n
  //     );
  //     const ethAmount = (totalAmount * withdrawFeePercent) / feeDenominator;
  //     expect(feeCollectorBalanceAfter).to.be.closeTo(
  //       feeCollectorBalanceBefore + ethAmount,
  //       ethers.parseEther("0.001")
  //     );
  //   });
  // });

  describe("withdrawETH", function () {
    const weights = ["5000", "5000"];
    let ethValue;

    beforeEach(async function () {
      tokens = [mtTokenAddress, alvaAddress];

      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      await bsktPair.initialize(args.factory, args.name, args.tokens);

      const buffer = 2000n;
      ethValue = ethers.parseEther("1");

      await bsktPair.transferOwnership(bsktAddress);

      await expect(
        bskt
          .connect(user1)
          .contribute(buffer, calculateDeadline(20), { value: ethValue })
      )
        .to.emit(bskt, "ContributedToBSKT")
        .withArgs(bsktAddress, user1.address, ethValue);
    });

    it("Contract should throw an error if buffer is 0", async function () {
      const buffer = 0n;
      const withdrawAmount = ethers.parseEther("0.5");
      await expect(
        bskt
          .connect(user1)
          .withdrawETH(withdrawAmount, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidBuffer");
    });

    it("Contract should throw an error if buffer is more then 5%", async function () {
      const buffer = 6000n;
      const withdrawAmount = ethers.parseEther("0.5");
      await expect(
        bskt
          .connect(user1)
          .withdrawETH(withdrawAmount, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidBuffer");
    });

    it("Contract should throw an error if amount is not allowed", async function () {
      const buffer = 2000n;
      const withdrawAmount = ethers.parseEther("10");
      await expect(
        bskt
          .connect(user1)
          .withdrawETH(withdrawAmount, buffer, calculateDeadline(20))
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Contract should throw an error if user has no liquidity", async function () {
      const buffer = 2000n;
      const withdrawAmount = ethers.parseEther("0.5");
      await bsktPair.connect(user2).approve(bsktAddress, withdrawAmount);

      await expect(
        bskt
          .connect(user2)
          .withdrawETH(withdrawAmount, buffer, calculateDeadline(20))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Contract should throw an error if 0 liquidity is given", async function () {
      const buffer = 2000n;
      const withdrawAmount = ethers.parseEther("0");

      await expect(
        bskt
          .connect(user1)
          .withdrawETH(withdrawAmount, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidWithdrawalAmount");
    });

    it("Contract should burn LP tokens if all okay Withdraw Eth ", async function () {
      const buffer = 2000n;
      const withdrawAmount = await bsktPair.balanceOf(user1.address);

      // Apply the withdrawal fee percentage - 0.5% fee
      const withdrawFeePercent = 50n; // 0.5% = 50 basis points
      const feeDenominator = 10000n;

      // Calculate base amounts
      const baseAmounts = await bsktPair.calculateShareTokens(withdrawAmount);
      const totalAmount = baseAmounts[0] + baseAmounts[1];

      const feeAmount = (totalAmount * withdrawFeePercent) / feeDenominator;
      const amountAfterFee = totalAmount - feeAmount;

      // Get feeCollector address from factory
      const [, , , feeCollector] = await factory.getPlatformFeeConfig();

      const tokenSupplyInitial = await bsktPair.totalSupply();
      const userEthBefore = await ethers.provider.getBalance(user1.address);
      const collectorEthBefore = await ethers.provider.getBalance(feeCollector);

      // Approve and withdraw
      await bsktPair.connect(user1).approve(bsktAddress, withdrawAmount);
      const tx = await bskt
        .connect(user1)
        .withdrawETH(withdrawAmount, buffer, calculateDeadline(20));
      const receipt = await tx.wait();

      const gasUsed = receipt.gasUsed * tx.gasPrice;
      const userEthAfter = await ethers.provider.getBalance(user1.address);
      const collectorEthAfter = await ethers.provider.getBalance(feeCollector);

      //check LP token-supply
      const tokenSupplyPost = await bsktPair.totalSupply();
      expect(tokenSupplyPost).to.equal(tokenSupplyInitial - withdrawAmount);

      // Verify user received 99.5% of ETH (minus gas)
      const actualUserGain = userEthAfter - userEthBefore + gasUsed;
      expect(actualUserGain).to.be.closeTo(
        amountAfterFee,
        ethers.parseEther("0.001")
      );

      // Verify feeCollector received 0.5% of ETH
      const actualCollectorGain = collectorEthAfter - collectorEthBefore;

      expect(actualCollectorGain).to.be.equal(feeAmount);

      // Validate event (optional)
      const event = receipt.logs.find(
        (log) => log.fragment?.name === "WithdrawnETHFromBSKT"
      );
      expect(event).to.not.be.undefined;
      expect(event.args.bskt).to.equal(bsktAddress);
      expect(event.args.amount).to.equal(amountAfterFee);
    });

    it("Contract should burn only given LP tokens if all okay", async function () {
      const buffer = 2000n;
      const withdrawAmount = ethers.parseEther("0.5");

      // Apply the withdrawal fee percentage - 0.5% fee
      const withdrawFeePercent = 50n; // 0.5% = 50 basis points
      const feeDenominator = 10000n;

      // Get base token amounts
      let baseAmounts = await bsktPair.calculateShareTokens(withdrawAmount);

      // Apply fee to the total ETH amount
      let totalAmount = baseAmounts[0] + baseAmounts[1];
      let amountAfterFee =
        totalAmount - (totalAmount * withdrawFeePercent) / feeDenominator;

      //check LP token-supply
      const tokenSupplyInitial = await bsktPair.totalSupply();
      const userEthBalanceBefore = await ethers.provider.getBalance(
        user1.address
      );
      const feeCollector = (await factory.getPlatformFeeConfig())[3];
      const feeCollectorBalanceBefore = await ethers.provider.getBalance(
        feeCollector
      );

      await bsktPair.connect(user1).approve(bsktAddress, withdrawAmount);
      const tx = await bskt
        .connect(user1)
        .withdrawETH(withdrawAmount, buffer, calculateDeadline(20));
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      // Expect event emission
      expect(
        receipt.logs.some((log) => log.fragment?.name === "WithdrawnETHFromBSKT")
      ).to.be.true;

      const tokenSupplyPost = await bsktPair.totalSupply();
      const userEthBalanceAfter = await ethers.provider.getBalance(
        user1.address
      );
      const feeCollectorBalanceAfter = await ethers.provider.getBalance(
        feeCollector
      );

      expect(tokenSupplyPost).to.be.equal(tokenSupplyInitial - withdrawAmount);
      expect(userEthBalanceAfter).to.be.closeTo(
        userEthBalanceBefore + amountAfterFee - gasUsed,
        ethers.parseEther("0.001")
      );
      // Calculate the fee amount
      const feeAmount = (totalAmount * withdrawFeePercent) / feeDenominator;
      expect(feeCollectorBalanceAfter).to.be.equal(
        feeCollectorBalanceBefore + feeAmount
      );
    });

    it("Contract should send ETH to user and feeCollector if all okay", async function () {
      const buffer = 2000n;
      const withdrawAmount = ethers.parseEther("0.5");

      // Apply the withdrawal fee percentage - 0.5% fee
      const withdrawFeePercent = 50n; // 0.5% = 50 basis points
      const feeDenominator = 10000n;

      // Get base token amounts
      const baseAmounts = await bsktPair.calculateShareTokens(withdrawAmount);

      // Total ETH value of tokens and calculation after fee
      const totalAmount = baseAmounts[0] + baseAmounts[1];
      const feeAmount = (totalAmount * withdrawFeePercent) / feeDenominator;
      const amountAfterFee = totalAmount - feeAmount;

      const userEthBalanceBefore = await ethers.provider.getBalance(
        user1.address
      );
      const feeCollector = (await factory.getPlatformFeeConfig())[3];
      const feeCollectorBalanceBefore = await ethers.provider.getBalance(
        feeCollector
      );

      await bsktPair.connect(user1).approve(bsktAddress, withdrawAmount);
      const tx = await bskt
        .connect(user1)
        .withdrawETH(withdrawAmount, buffer, calculateDeadline(20));
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const userEthBalanceAfter = await ethers.provider.getBalance(
        user1.address
      );
      const feeCollectorBalanceAfter = await ethers.provider.getBalance(
        feeCollector
      );

      // Expect event emitted
      expect(
        receipt.logs.some((log) => log.fragment?.name === "WithdrawnETHFromBSKT")
      ).to.be.true;

      // Check ETH transfer results
      expect(userEthBalanceAfter).to.be.closeTo(
        userEthBalanceBefore + amountAfterFee - gasUsed,
        ethers.parseEther("0.001")
      );
      expect(feeCollectorBalanceAfter).to.equal(
        feeCollectorBalanceBefore + feeAmount
      );
    });
  });

  describe("Rebalance", function () {
    const weights = ["5000", "5000"];
    let ethValue;

    beforeEach(async function () {
      tokens = [mtTokenAddress, alvaAddress];

      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      await bsktPair.initialize(args.factory, args.name, args.tokens);

      const buffer = 2000n;
      ethValue = ethers.parseEther("1");

      await bsktPair.transferOwnership(bsktAddress);

      await expect(
        bskt
          .connect(user1)
          .contribute(buffer, calculateDeadline(20), { value: ethValue })
      )
        .to.emit(bskt, "ContributedToBSKT")
        .withArgs(bsktAddress, user1.address, ethValue);
    });

    it("Contract should throw an error if buffer is 0", async function () {
      const buffer = 0;
      const newTokens = [alvaAddress];
      const newWeights = ["10000"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidBuffer");
    });
    it("Contract should throw an error while passing invalid deadline", async function () {
      const buffer = 100;
      const newTokens = [alvaAddress];
      const newWeights = ["10000"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(0))
      ).to.be.revertedWithCustomError(bskt, "DeadlineInPast");
    });

    it("Contract should throw an error if buffer is more then 5%", async function () {
      const buffer = 5001;
      const newTokens = [alvaAddress];
      const newWeights = ["10000"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidBuffer");
    });

    it("Contract should throw an error if duplicate tokens are added", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, alvaAddress];
      const newWeights = ["5000", "5000"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "DuplicateToken");
    });

    it("Contract should throw an error if any token weight is 0", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["10000", "0"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "ZeroTokenWeight");
    });

    it("Contract should throw an error if any token weights is not 100% ", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["9800", "1000"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidWeight");
    });

    it("Contract should throw an error if tokens and weights are not equal ", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["9800", "1000", "1000"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidLength");
    });

    it("Contract should throw an error if called by other then owner ", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["9800", "200"];

      await expect(
        bskt
          .connect(user1)
          .rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InvalidOwner");
    });

    it("Contract should throw an error if Alva is not added", async function () {
      const buffer = 2000;
      const newTokens = [wETHAddress, mtTokenAddress];
      const newWeights = ["9400", "600"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "NoAlvaTokenIncluded");
    });

    it("Contract should throw an error if Alva perecentage is less then 5%", async function () {
      const buffer = 2000;
      const newTokens = [mtTokenAddress, alvaAddress];
      const newWeights = ["9800", "200"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.be.revertedWithCustomError(bskt, "InsufficientAlvaPercentage");
    });

    it("Contract should update tokens with new tokens and weights if all okay", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["9800", "200"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      )
        .to.emit(bskt, "BSKTRebalanced")
        .withArgs(bsktAddress, tokens, weights, newTokens, newWeights);

      // Verify token details were updated
      const tokenDetails = await bskt.getTokenDetails();
      expect(tokenDetails.tokens.length).to.equal(newTokens.length);
      expect(tokenDetails.weights[0].toString()).to.equal(newWeights[0]);
      expect(tokenDetails.weights[1].toString()).to.equal(newWeights[1]);
    });

    it("Contract should successfully rebalance with same tokens but different weights", async function () {
      const buffer = 2000;
      const oldWeights = ["5000", "5000"];
      const newWeights = ["9500", "500"];

      await expect(
        bskt.rebalance(tokens, newWeights, buffer, calculateDeadline(20))
      )
        .to.emit(bskt, "BSKTRebalanced")
        .withArgs(bsktAddress, tokens, oldWeights, tokens, newWeights);

      // Verify only weights were updated
      const updatedDetails = await bskt.getTokenDetails();
      expect(updatedDetails.tokens).to.deep.equal(tokens);
      expect(updatedDetails.weights[0].toString()).to.equal(newWeights[0]);
      expect(updatedDetails.weights[1].toString()).to.equal(newWeights[1]);
    });

    it("Contract should successfully add a new token during rebalance", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress, wETHAddress];
      const newWeights = ["9000", "500", "500"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.emit(bskt, "BSKTRebalanced");

      // Verify new token was added
      const updatedDetails = await bskt.getTokenDetails();
      expect(updatedDetails.tokens.length).to.equal(3);
      expect(updatedDetails.tokens[2]).to.equal(wETHAddress);
      expect(updatedDetails.weights[2].toString()).to.equal("500");
    });

    it("Contract should successfully remove a token during rebalance", async function () {
      // First add multiple tokens
      const buffer = 2000;
      const intermediateTokens = [alvaAddress, mtTokenAddress, wETHAddress];
      const intermediateWeights = ["9000", "500", "500"];

      await bskt.rebalance(
        intermediateTokens,
        intermediateWeights,
        buffer,
        calculateDeadline(20)
      );

      // Now remove one token
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["9500", "500"];

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.emit(bskt, "BSKTRebalanced");

      // Verify token was removed
      const updatedDetails = await bskt.getTokenDetails();
      expect(updatedDetails.tokens.length).to.equal(2);
      expect(updatedDetails.tokens[0]).to.equal(alvaAddress);
      expect(updatedDetails.tokens[1]).to.equal(mtTokenAddress);
    });

    it("Contract should handle rebalancing with minimum ALVA percentage (5%)", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["500", "9500"]; // 5% ALVA

      await expect(
        bskt.rebalance(newTokens, newWeights, buffer, calculateDeadline(20))
      ).to.emit(bskt, "BSKTRebalanced");

      // Verify weights were updated correctly
      const updatedDetails = await bskt.getTokenDetails();
      expect(updatedDetails.weights[0].toString()).to.equal("500");
      expect(updatedDetails.weights[1].toString()).to.equal("9500");
    });
  });

  describe("EmergencyStable", function () {
    const weights = ["5000", "5000"];
    let ethValue;

    beforeEach(async function () {
      tokens = [mtTokenAddress, alvaAddress];

      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      await bsktPair.initialize(args.factory, args.name, args.tokens);

      const buffer = 2000n;
      ethValue = ethers.parseEther("1");

      await bsktPair.transferOwnership(bsktAddress);

      await expect(
        bskt
          .connect(user1)
          .contribute(buffer, calculateDeadline(20), { value: ethValue })
      )
        .to.emit(bskt, "ContributedToBSKT")
        .withArgs(bsktAddress, user1.address, ethValue);
    });

    it("Contract should throw an error if buffer is 0", async function () {
      const buffer = 0;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["500", "9500"];

      await expect(
        bskt.emergencyStable(
          newTokens,
          newWeights,
          buffer,
          calculateDeadline(20)
        )
      ).to.be.revertedWithCustomError(bskt, "InvalidBuffer");
    });

    it("Contract should throw an error while passing the invalid deadline", async function () {
      const buffer = 100;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["500", "9500"];

      await expect(
        bskt.emergencyStable(
          newTokens,
          newWeights,
          buffer,
          calculateDeadline(0)
        )
      ).to.be.revertedWithCustomError(bskt, "DeadlineInPast");
    });

    it("Contract should throw an error if buffer is more then 5%", async function () {
      const buffer = 5001;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["500", "9500"];

      await expect(
        bskt.emergencyStable(
          newTokens,
          newWeights,
          buffer,
          calculateDeadline(20)
        )
      ).to.be.revertedWithCustomError(bskt, "InvalidBuffer");
    });

    it("Contract should throw an error if duplicate tokens are added", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, alvaAddress];
      const newWeights = ["500", "9500"];

      await expect(
        bskt.emergencyStable(
          newTokens,
          newWeights,
          buffer,
          calculateDeadline(20)
        )
      ).to.be.revertedWithCustomError(bskt, "DuplicateToken");
    });

    it("Contract should throw an error if tokens array is not of length 2", async function () {
      const buffer = 2000;

      // Test with 1 token
      const singleToken = [alvaAddress];
      const singleWeight = ["10000"];
      await expect(
        bskt.emergencyStable(
          singleToken,
          singleWeight,
          buffer,
          calculateDeadline(20)
        )
      ).to.be.revertedWithCustomError(bskt, "InvalidEmergencyParams");

      // Test with 3 tokens
      const tripleTokens = [alvaAddress, mtTokenAddress, wETHAddress];
      const tripleWeights = ["500", "4750", "4750"];
      await expect(
        bskt.emergencyStable(
          tripleTokens,
          tripleWeights,
          buffer,
          calculateDeadline(20)
        )
      ).to.be.revertedWithCustomError(bskt, "InvalidEmergencyParams");
    });

    it("Contract should throw an error if weights don't add up to 100%", async function () {
      const buffer = 2000;

      // Test with weights < 100%
      const newTokens = [alvaAddress, mtTokenAddress];
      const underWeights = ["500", "9400"]; // 99%
      await expect(
        bskt.emergencyStable(
          newTokens,
          underWeights,
          buffer,
          calculateDeadline(20)
        )
      ).to.be.revertedWithCustomError(bskt, "InvalidWeight");

      // Test with weights > 100%
      const overWeights = ["500", "9600"]; // 101%
      await expect(
        bskt.emergencyStable(
          newTokens,
          overWeights,
          buffer,
          calculateDeadline(20)
        )
      ).to.be.revertedWithCustomError(bskt, "InvalidWeight");
    });

    it("Contract should throw an error if called by non-owner", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["500", "9500"];

      await expect(
        bskt
          .connect(user1)
          .emergencyStable(
            newTokens,
            newWeights,
            buffer,
            calculateDeadline(20)
          )
      ).to.be.revertedWithCustomError(bskt, "InvalidOwner");
    });

    it("Contract should not throw an error if first token is not ALVA", async function () {
      const buffer = 2000;
      const newTokens = [mtTokenAddress, alvaAddress];
      const newWeights = ["500", "9500"];

      // Get current token details before emergency stable
      const tokenDetailsBefore = await bskt.getTokenDetails();
      const oldTokens = tokenDetailsBefore.tokens;
      const oldWeights = tokenDetailsBefore.weights;

      await expect(
        bskt.emergencyStable(
          newTokens,
          newWeights,
          buffer,
          calculateDeadline(20)
        )
      )
        .to.emit(bskt, "BSKTRebalanced")
        .withArgs(bsktAddress, oldTokens, oldWeights, newTokens, newWeights);

      // Verify token details were updated correctly
      const tokenDetailsAfter = await bskt["getTokenDetails()"]();
      expect(tokenDetailsAfter.tokens.length).to.equal(2);
      expect(tokenDetailsAfter.tokens[1]).to.equal(alvaAddress);
      expect(tokenDetailsAfter.tokens[0]).to.equal(mtTokenAddress);
      expect(tokenDetailsAfter.weights[0]).to.equal(500n);
      expect(tokenDetailsAfter.weights[1]).to.equal(9500n);
    });

    it("Contract should throw an error if ALVA weight is less then 5%", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress];

      // Test with ALVA < 5%
      const lowAlvaWeights = ["400", "9600"];
      await expect(
        bskt.emergencyStable(
          newTokens,
          lowAlvaWeights,
          buffer,
          calculateDeadline(20)
        )
      ).to.be.revertedWithCustomError(bskt, "InsufficientAlvaPercentage");

      // Test with ALVA > 5% // accesspted
      const highAlvaWeights = ["499", "9501"];
      await expect(
        bskt.emergencyStable(
          newTokens,
          highAlvaWeights,
          buffer,
          calculateDeadline(20)
        )
      ).to.be.revertedWithCustomError(bskt, "InsufficientAlvaPercentage");
    });

    it("Contract should successfully update tokens if parameters are valid", async function () {
      const buffer = 2000;
      const newTokens = [alvaAddress, mtTokenAddress];
      const newWeights = ["500", "9500"];

      // Ensure factory WETH is returning correctly
      await factory.weth();

      // Transfer tokens to router for swap results
      await alva.transfer(routerAddress, ethers.parseEther("5"));
      await mtToken.transfer(routerAddress, ethers.parseEther("5"));
      await wETH.transfer(routerAddress, ethers.parseEther("5"));

      // Get current token details before emergency stable
      const tokenDetailsBefore = await bskt.getTokenDetails();
      const oldTokens = tokenDetailsBefore.tokens;
      const oldWeights = tokenDetailsBefore.weights;

      await expect(
        bskt.emergencyStable(
          newTokens,
          newWeights,
          buffer,
          calculateDeadline(20)
        )
      )
        .to.emit(bskt, "BSKTRebalanced")
        .withArgs(bsktAddress, oldTokens, oldWeights, newTokens, newWeights);

      // Verify token details were updated correctly
      const tokenDetailsAfter = await bskt["getTokenDetails()"]();
      expect(tokenDetailsAfter.tokens.length).to.equal(2);
      expect(tokenDetailsAfter.tokens[0]).to.equal(alvaAddress);
      expect(tokenDetailsAfter.tokens[1]).to.equal(mtTokenAddress);
      expect(tokenDetailsAfter.weights[0]).to.equal(500n);
      expect(tokenDetailsAfter.weights[1]).to.equal(9500n);
    });
  });

  describe("ERC721 and Interface Functions", function () {
    const weights = ["5000", "5000"];

    beforeEach(async function () {
      tokens = [mtTokenAddress, alvaAddress];

      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );
    });

    it("Should check if contract supports ERC2981 interface", async function () {
      const erc2981InterfaceId = "0x2a55205a";
      const supportsERC2981 = await bskt.supportsInterface(erc2981InterfaceId);
      expect(supportsERC2981).to.be.true;
    });

    it("Should check if contract supports ERC721 interface", async function () {
      const erc721InterfaceId = "0x80ac58cd";
      const supportsERC721 = await bskt.supportsInterface(erc721InterfaceId);
      expect(supportsERC721).to.be.true;
    });

    it("Should get royalty info", async function () {
      const salePrice = ethers.parseEther("1");
      const royaltyInfo = await bskt.royaltyInfo(0, salePrice);

      expect(royaltyInfo.receiver).to.not.equal(zeroAddress);
      expect(royaltyInfo.royaltyAmount).to.be.gt(0);
    });

    it("Should get contract URI", async function () {
      const contractURI = await bskt.contractURI();
      expect(contractURI).to.be.a("string");
      expect(contractURI.length).to.be.gt(0);
    });
  });

  describe("Token Operations", function () {
    const weights = ["5000", "5000"];

    beforeEach(async function () {
      tokens = [mtTokenAddress, alvaAddress];

      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );
    });

    it("Should get all token details with getTokenDetails()", async function () {
      const tokenDetails = await bskt["getTokenDetails()"]();

      expect(tokenDetails.tokens.length).to.equal(2);
      expect(tokenDetails.weights.length).to.equal(2);

      expect(tokenDetails.tokens[0]).to.equal(tokens[0]);
      expect(tokenDetails.tokens[1]).to.equal(tokens[1]);

      expect(tokenDetails.weights[0]).to.equal(weights[0]);
      expect(tokenDetails.weights[1]).to.equal(weights[1]);
    });

    it("Should get token details by index with getTokenDetails(index)", async function () {
      // Use explicit method signature to resolve ambiguity
      const token0 = await bskt["getTokenDetails(uint256)"](0);
      expect(token0.token).to.equal(tokens[0]);
      expect(token0.weight).to.equal(weights[0]);

      const token1 = await bskt["getTokenDetails(uint256)"](1);
      expect(token1.token).to.equal(tokens[1]);
      expect(token1.weight).to.equal(weights[1]);
    });

    it("Should revert with TokenIndexOutOfBounds when index is invalid", async function () {
      // The basket has only two tokens (0 and 1), so index 2 is out of bounds
      await expect(
        bskt["getTokenDetails(uint256)"](2)
      ).to.be.revertedWithCustomError(bskt, "TokenIndexOutOfBounds");
    });

    it("Should get total number of tokens with totalTokens()", async function () {
      const totalTokens = await bskt.totalTokens();
      expect(totalTokens).to.equal(2);
    });
  });

  describe("ERC721 Token Transfer Functions", function () {
    const weights = ["5000", "5000"];

    beforeEach(async function () {
      tokens = [mtTokenAddress, alvaAddress];

      const args = {
        name,
        symbol: name + "-symbol",
        owner: owner.address,
        factory: factoryAddress,
        tokens,
        weights,
        bsktPair: bsktPairAddress,
        tokenURI,
        description,
      };

      await bskt.initialize(
        args.name,
        args.symbol,
        args.owner,
        args.factory,
        args.tokens,
        args.weights,
        args.bsktPair,
        args.tokenURI,
        args.name,
        args.description
      );

      // Check that the token was minted to the owner
      expect(await bskt.ownerOf(0)).to.equal(owner.address);
    });

    it("Should allow owner to approve another address", async function () {
      await bskt.approve(user1.address, 0);
      const approved = await bskt.getApproved(0);
      expect(approved).to.equal(user1.address);
    });

    it("Should allow owner to set approval for all", async function () {
      await bskt.setApprovalForAll(user1.address, true);
      const isApproved = await bskt.isApprovedForAll(
        owner.address,
        user1.address
      );
      expect(isApproved).to.be.true;
    });

    it("Should allow transfer of token when approved", async function () {
      await bskt.approve(user1.address, 0);
      await bskt.connect(user1).transferFrom(owner.address, user1.address, 0);
      const newOwner = await bskt.ownerOf(0);
      expect(newOwner).to.equal(user1.address);
    });

    it("Should allow safeTransferFrom to work correctly", async function () {
      // Since we've mocked isWhitelistedContract to return true, this should work
      await bskt.safeTransferFrom(owner.address, user2.address, 0);
      const newOwner = await bskt.ownerOf(0);
      expect(newOwner).to.equal(user2.address);
    });

    it("Should support ERC721 interface", async function () {
      // 0x80ac58cd is the interface ID for ERC721
      const supportsERC721 = await bskt.supportsInterface("0x80ac58cd");
      expect(supportsERC721).to.be.true;
    });
  });
});
