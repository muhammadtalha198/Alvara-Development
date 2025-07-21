const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

describe.only("Contract Balances Test", function () {
  let owner, user1, user2;
  let bskt, bsktPair, factory, wETH, alva, mtToken, router;
  let wETHAddress, alvaAddress, mtTokenAddress, routerAddress;
  let newbsktAddress, newbsktPairAddress;

  // Calculate Deadline
  function calculateDeadline(minutes = 20) {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const buffer = minutes * 60; // Convert minutes to seconds
    return currentTime + buffer;
  }

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy all contracts
    const allDeployments = await deployments.fixture(["all-eth"]);

    // Get contract instances
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

    // Get contract addresses
    wETHAddress = await wETH.getAddress();
    bsktAddress = await bskt.getAddress();
    bsktPairAddress = await bsktPair.getAddress();
    factoryAddress = await factory.getAddress();
    alvaAddress = await alva.getAddress();
    mtTokenAddress = await mtToken.getAddress();
    routerAddress = await router.getAddress();

    // Set token prices in the router
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

    // Mint and approve tokens
    await wETH.mint(owner.address, ethers.parseEther("100000000000"));
    await wETH.approve(routerAddress, ethers.parseEther("100000000000"));
    await alva.approve(routerAddress, ethers.parseEther("100000000000"));
    await mtToken.approve(routerAddress, ethers.parseEther("100000000000"));

    // Set ALVA listing timestamp
    await alva.setListingTimestamp("100");

    await factory.grantRole(await factory.ADMIN_ROLE(), owner.address);
    await factory.grantRole(await factory.FEE_MANAGER_ROLE(), owner.address);
    await factory.grantRole(await factory.WHITELIST_MANAGER_ROLE(), owner.address);
    await factory.grantRole(await factory.UPGRADER_ROLE(), owner.address);
    await factory.grantRole(await factory.URI_MANAGER_ROLE(), owner.address);
    
    // Set user2 as the fee collector (different from the caller user1)
    await factory.setFeeCollector(user2.address);


  });

  it("should create a bskt (with fee) and verify its balances remain zero", async function () {
    const name = "Balance-Test-Token";
    const symbol = "BTT";
    const tokens = [mtTokenAddress, alvaAddress];
    const weights = ["5000", "5000"]; // 50% each
    const tokenURI = "https://my-nft.test.metadata.com";
    const buffer = 100; // 1%
    const _id = "balance-test-bskt";
    const description = "This is a test bskt for balance testing";

    // Create a new bskt
    const createbsktTx = await factory.createBSKT(
      name,
      symbol,
      tokens,
      weights,
      tokenURI,
      buffer,
      _id,
      description,
      calculateDeadline(20),
      { value: ethers.parseEther("1") }
    );

    // Get the bskt and bsktPair addresses from the event
    const receipt = await createbsktTx.wait();

    let createdbsktEvent = null;
    let feeDeductedEvent = null;

    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "BSKTCreated") {
          createdbsktEvent = parsedLog;
          newbsktAddress = parsedLog.args.bskt;
          newbsktPairAddress = parsedLog.args.bsktPair;
        } else if (parsedLog?.name === "BSKTCreationFeeDeducted") {
          feeDeductedEvent = parsedLog;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    //Verify if the fee deduction is done
    expect(feeDeductedEvent).to.not.be.null;

    // Verify bskt addresses were extracted
    expect(newbsktAddress).to.not.be.null;
    expect(newbsktPairAddress).to.not.be.null;

    // Check the ETH balance of the bskt contract
    const ethBalance = await ethers.provider.getBalance(newbsktAddress);
    expect(ethBalance).to.equal(0, "bskt contract should have zero ETH balance");

    // Check WETH balance of the bskt contract
    const wethBalance = await wETH.balanceOf(newbsktAddress);
    expect(wethBalance).to.equal(
      0,
      "bskt contract should have zero WETH balance"
    );
    // Check mt token balances of the bskt contract
    const mtTokenBalance = await mtToken.balanceOf(newbsktAddress);
    expect(mtTokenBalance).to.equal(
      0,
      "bskt contract should have zero MT token balance"
    );

    // Check alva token balances of the bskt contract
    const alvaTokenBalance = await alva.balanceOf(newbsktAddress);
    expect(alvaTokenBalance).to.equal(
      0,
      "bskt contract should have zero ALVA token balance"
    );
  });

  it("should contribute (with fee) to bskt and verify its balances remain zero", async function () {
    // Create a bskt first
    const name = "Contribute-Balance-Test";
    const symbol = "CBT";
    const tokens = [mtTokenAddress, alvaAddress];
    const weights = ["5000", "5000"]; // 50% each
    const tokenURI = "https://my-nft.test.metadata.com";
    const buffer = 100; // 1%
    const _id = "contribute-balance-test";
    const description = "This is a test bskt for contribution balance testing";

    // Create a new bskt
    const createbsktTx = await factory.createBSKT(
      name,
      symbol,
      tokens,
      weights,
      tokenURI,
      buffer,
      _id,
      description,
      calculateDeadline(20),
      { value: ethers.parseEther("1") }
    );

    // Get the bskt and bsktPair addresses from the event
    const receipt = await createbsktTx.wait();

    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "BSKTCreated") {
          newbsktAddress = parsedLog.args.bskt;
          newbsktPairAddress = parsedLog.args.bsktPair;
          break;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Get the new bskt contract instance
    const newbskt = await ethers.getContractAt(
      "BasketTokenStandard",
      newbsktAddress
    );

    // Check the ETH balance of the bskt contract before contribution
    const ethBalanceBefore = await ethers.provider.getBalance(newbsktAddress);
    const wethBalanceBefore = await wETH.balanceOf(newbsktAddress);
    const mtTokenBalanceBefore = await mtToken.balanceOf(newbsktAddress);
    const alvaTokenBalanceBefore = await alva.balanceOf(newbsktAddress);

    expect(ethBalanceBefore).to.equal(
      0,
      "bskt contract should have zero ETH balance before contribution"
    );

    expect(wethBalanceBefore).to.equal(
      0,
      "bskt contract should have zero WETH balance before contribution"
    );
    expect(mtTokenBalanceBefore).to.equal(
      0,
      "bskt contract should have zero MT token balance before contribution"
    );
    expect(alvaTokenBalanceBefore).to.equal(
      0,
      "bskt contract should have zero ALVA token balance before contribution"
    );

    // Contribute to the bskt
    const contributeTx = await newbskt
      .connect(user1)
      .contribute(buffer, calculateDeadline(20), {
        value: ethers.parseEther("0.5"),
      });
    const contributeReceipt = await contributeTx.wait();

    // Check for PlatformFeeDeducted event
    let feePaidEvent = null;
    for (const log of contributeReceipt.logs) {
      try {
        const parsedLog = newbskt.interface.parseLog(log);
        if (parsedLog?.name === "PlatformFeeDeducted") {
          feePaidEvent = parsedLog;
          break;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    expect(feePaidEvent.args.action).to.equal("contribute");

    // Check the ETH balance of the bskt contract after contribution
    const bsktBalanceAfter = await ethers.provider.getBalance(newbsktAddress);
    const wethBalanceAfter = await wETH.balanceOf(newbsktAddress);
    const mtTokenBalanceAfter = await mtToken.balanceOf(newbsktAddress);
    const alvaTokenBalanceAfter = await alva.balanceOf(newbsktAddress);

    expect(bsktBalanceAfter).to.equal(
      0,
      "bskt contract should have zero ETH balance after contribution"
    );

    expect(wethBalanceAfter).to.equal(
      0,
      "bskt contract should have zero WETH balance after contribution"
    );
    expect(mtTokenBalanceAfter).to.equal(
      0,
      "bskt contract should have zero MT token balance after contribution"
    );
    expect(alvaTokenBalanceAfter).to.equal(
      0,
      "bskt contract should have zero ALVA token balance after contribution"
    );
  });

  it("should withdraw ETH (with fee)  from bskt and verify its balances remain zero", async function () {
    // Create a bskt first
    const name = "Withdraw-Balance-Test";
    const symbol = "WBT";
    const tokens = [mtTokenAddress, alvaAddress];
    const weights = ["5000", "5000"]; // 50% each
    const tokenURI = "https://my-nft.test.metadata.com";
    const buffer = 100; // 1%
    const _id = "withdraw-balance-test";
    const description = "This is a test bskt for withdrawal balance testing";

    // Create a new bskt
    const createbsktTx = await factory.createBSKT(
      name,
      symbol,
      tokens,
      weights,
      tokenURI,
      buffer,
      _id,
      description,
      calculateDeadline(20),
      { value: ethers.parseEther("1") }
    );

    // Get the bskt and bsktPair addresses from the event
    const receipt = await createbsktTx.wait();

    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "BSKTCreated") {
          newbsktAddress = parsedLog.args.bskt;
          newbsktPairAddress = parsedLog.args.bsktPair;
          break;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Get the new bskt and bsktPair contract instances
    const newbskt = await ethers.getContractAt(
      "BasketTokenStandard",
      newbsktAddress
    );
    const newbsktPair = await ethers.getContractAt(
      "BasketTokenStandardPair",
      newbsktPairAddress
    );

    // Check the ETH balance of the bskt contract after creation
    const ethBalanceAfterCreation = await ethers.provider.getBalance(
      newbsktAddress
    );
    const wethBalanceAfterCreation = await wETH.balanceOf(newbsktAddress);
    const mtTokenBalanceAfterCreation = await mtToken.balanceOf(newbsktAddress);
    const alvaTokenBalanceAfterCreation = await alva.balanceOf(newbsktAddress);

    expect(ethBalanceAfterCreation).to.equal(
      0,
      "bskt contract should have zero ETH balance after creation"
    );
    expect(wethBalanceAfterCreation).to.equal(
      0,
      "bskt contract should have zero WETH balance after creation"
    );
    expect(mtTokenBalanceAfterCreation).to.equal(
      0,
      "bskt contract should have zero MT token balance after creation"
    );
    expect(alvaTokenBalanceAfterCreation).to.equal(
      0,
      "bskt contract should have zero ALVA token balance after creation"
    );

    // Get owner's LP token balance (owner created the bskt and received LP tokens)
    const ownerLpBalance = await newbsktPair.balanceOf(owner.address);
    expect(ownerLpBalance).to.be.gt(
      0,
      "Owner should have LP tokens after bskt creation"
    );

    // Approve bskt to spend LP tokens
    await newbsktPair.connect(owner).approve(newbsktAddress, ownerLpBalance);

    // Withdraw ETH from the bskt
    const withdrawTx = await newbskt
      .connect(owner)
      .withdrawETH(ownerLpBalance, buffer, calculateDeadline(20));
    const withdrawReceipt = await withdrawTx.wait();

    // Check for PlatformFeeDeducted event
    let feePaidEvent = null;
    for (const log of withdrawReceipt.logs) {
      try {
        const parsedLog = newbskt.interface.parseLog(log);
        if (parsedLog?.name === "PlatformFeeDeducted") {
          feePaidEvent = parsedLog;
          break;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    expect(feePaidEvent.args.action).to.equal("withdrawETH");

    // Check the ETH balance of the bskt contract after withdrawal
    const ethBalanceAfter = await ethers.provider.getBalance(newbsktAddress);
    expect(ethBalanceAfter).to.equal(
      0,
      "bskt contract should have zero ETH balance after withdrawal"
    );

    // Check token balances after withdrawal
    const wethBalanceAfterWithdraw = await wETH.balanceOf(newbsktAddress);
    const mtTokenBalanceAfterWithdraw = await mtToken.balanceOf(newbsktAddress);
    const alvaTokenBalanceAfterWithdraw = await alva.balanceOf(newbsktAddress);

    expect(wethBalanceAfterWithdraw).to.equal(
      0,
      "bskt contract should have zero WETH balance after withdrawal"
    );
    expect(mtTokenBalanceAfterWithdraw).to.equal(
      0,
      "bskt contract should have zero MT token balance after withdrawal"
    );
    expect(alvaTokenBalanceAfterWithdraw).to.equal(
      0,
      "bskt contract should have zero ALVA token balance after withdrawal"
    );
  });

  // it("should withdraw (with fee) tokens from bskt and verify its balances remain zero", async function () {
  //   // Create a bskt first
  //   const name = "Withdraw-Tokens-Balance-Test";
  //   const symbol = "WTBT";
  //   const tokens = [mtTokenAddress, alvaAddress];
  //   const weights = ["5000", "5000"]; // 50% each
  //   const tokenURI = "https://my-nft.test.metadata.com";
  //   const buffer = 100; // 1%
  //   const _id = "withdraw-tokens-balance-test";
  //   const description =
  //     "This is a test bskt for token withdrawal balance testing";

  //   // Create a new bskt
  //   const createbsktTx = await factory.createBSKT(
  //     name,
  //     symbol,
  //     tokens,
  //     weights,
  //     tokenURI,
  //     buffer,
  //     _id,
  //     description,
  //     calculateDeadline(20),
  //     { value: ethers.parseEther("1") }
  //   );

  //   // Get the bskt and bsktPair addresses from the event
  //   const receipt = await createbsktTx.wait();

  //   for (const log of receipt.logs) {
  //     try {
  //       const parsedLog = factory.interface.parseLog(log);
  //       if (parsedLog?.name === "BSKTCreated") {
  //         newbsktAddress = parsedLog.args.bskt;
  //         newbsktPairAddress = parsedLog.args.bsktPair;
  //         break;
  //       }
  //     } catch (error) {
  //       // Ignore parsing errors
  //     }
  //   }

  //   // Get the new bskt and bsktPair contract instances
  //   const newbskt = await ethers.getContractAt(
  //     "BasketTokenStandard",
  //     newbsktAddress
  //   );
  //   const newbsktPair = await ethers.getContractAt(
  //     "BasketTokenStandardPair",
  //     newbsktPairAddress
  //   );

  //   // Check the ETH balance of the bskt contract after creation
  //   const ethBalanceAfterCreation = await ethers.provider.getBalance(
  //     newbsktAddress
  //   );
  //   const wethBalanceAfterCreation = await wETH.balanceOf(newbsktAddress);
  //   const mtTokenBalanceAfterCreation = await mtToken.balanceOf(newbsktAddress);
  //   const alvaTokenBalanceAfterCreation = await alva.balanceOf(newbsktAddress);

  //   expect(ethBalanceAfterCreation).to.equal(
  //     0,
  //     "bskt contract should have zero ETH balance after creation"
  //   );
  //   expect(wethBalanceAfterCreation).to.equal(
  //     0,
  //     "bskt contract should have zero WETH balance after creation"
  //   );
  //   expect(mtTokenBalanceAfterCreation).to.equal(
  //     0,
  //     "bskt contract should have zero MT token balance after creation"
  //   );
  //   expect(alvaTokenBalanceAfterCreation).to.equal(
  //     0,
  //     "bskt contract should have zero ALVA token balance after creation"
  //   );

  //   // Get owner's LP token balance (owner created the bskt and received LP tokens)
  //   const ownerLpBalance = await newbsktPair.balanceOf(owner.address);
  //   expect(ownerLpBalance).to.be.gt(
  //     0,
  //     "Owner should have LP tokens after bskt creation"
  //   );

  //   // Approve bskt to spend LP tokens
  //   await newbsktPair.connect(owner).approve(newbsktAddress, ownerLpBalance);

  //   // Withdraw tokens from the bskt (not ETH)
  //   const withdrawTx = await newbskt
  //     .connect(owner)
  //     .withdraw(ownerLpBalance, 100, calculateDeadline(20));
  //   const withdrawReceipt = await withdrawTx.wait();

  //   // Check for PlatformFeeDeducted event
  //   let feePaidEvent = null;
  //   for (const log of withdrawReceipt.logs) {
  //     try {
  //       const parsedLog = newbskt.interface.parseLog(log);
  //       if (parsedLog?.name === "PlatformFeeDeducted") {
  //         feePaidEvent = parsedLog;
  //         break;
  //       }
  //     } catch (error) {
  //       // Ignore parsing errors
  //     }
  //   }

  //   expect(feePaidEvent.args.action).to.equal("withdrawTokens");

  //   // Check the ETH balance of the bskt contract after withdrawal
  //   const ethBalanceAfter = await ethers.provider.getBalance(newbsktAddress);
  //   expect(ethBalanceAfter).to.equal(
  //     0,
  //     "bskt contract should have zero ETH balance after withdrawal"
  //   );

  //   // Check token balances after withdrawal
  //   const wethBalanceAfterWithdraw = await wETH.balanceOf(newbsktAddress);
  //   const mtTokenBalanceAfterWithdraw = await mtToken.balanceOf(newbsktAddress);
  //   const alvaTokenBalanceAfterWithdraw = await alva.balanceOf(newbsktAddress);

  //   expect(wethBalanceAfterWithdraw).to.equal(
  //     0,
  //     "bskt contract should have zero WETH balance after withdrawal"
  //   );
  //   expect(mtTokenBalanceAfterWithdraw).to.equal(
  //     0,
  //     "bskt contract should have zero MT token balance after withdrawal"
  //   );
  //   expect(alvaTokenBalanceAfterWithdraw).to.equal(
  //     0,
  //     "bskt contract should have zero ALVA token balance after withdrawal"
  //   );
  // });

  it("should set and verify all platform fees to 0% ", async function () {
    // Set platform fee to 0%
    await expect(factory.setPlatformFeeConfig(0, 0, 0))
      .to.emit(factory, "PlatformFeesUpdated")
      .withArgs(0, 0, 0);

    // Verify the fee configuration was updated
    const feeConfig = await factory.getPlatformFeeConfig();
    expect(feeConfig[0]).to.equal(0, "Creation fee should be 0%");
    expect(feeConfig[1]).to.equal(0, "Contribution fee should be 0%");
    expect(feeConfig[2]).to.equal(0, "Withdrawal fee should be 0%");
  });

  it("should create a bskt (without fee) and verify contract balances remain zero", async function () {
    // Setting All fee to be 0%
    await expect(factory.setPlatformFeeConfig(0, 0, 0))
      .to.emit(factory, "PlatformFeesUpdated")
      .withArgs(0, 0, 0);

    const name = "Balance-Test-Token";
    const symbol = "BTT";
    const tokens = [mtTokenAddress, alvaAddress];
    const weights = ["5000", "5000"]; // 50% each
    const tokenURI = "https://my-nft.test.metadata.com";
    const buffer = 100; // 1%
    const _id = "balance-test-bskt";
    const description = "This is a test bskt for balance testing";

    // Create a new bskt
    const createbsktTx = await factory.createBSKT(
      name,
      symbol,
      tokens,
      weights,
      tokenURI,
      buffer,
      _id,
      description,
      calculateDeadline(20),
      { value: ethers.parseEther("1") }
    );

    // Get the bskt and bsktPair addresses from the event
    const receipt = await createbsktTx.wait();

    let createdbsktEvent = null;
    let feeDeductedEvent = null;

    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "BSKTCreated") {
          createdbsktEvent = parsedLog;
          newbsktAddress = parsedLog.args.bskt;
          newbsktPairAddress = parsedLog.args.bsktPair;
        } else if (parsedLog?.name === "BSKTCreationFeeDeducted") {
          feeDeductedEvent = parsedLog;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    //Verify that the fee deduction event is not emitted when fees are set to 0%
    expect(feeDeductedEvent).to.be.null;

    // Verify bskt addresses were extracted
    expect(newbsktAddress).to.not.be.null;
    expect(newbsktPairAddress).to.not.be.null;

    // Check the ETH balance of the bskt contract
    const ethBalance = await ethers.provider.getBalance(newbsktAddress);
    expect(ethBalance).to.equal(0, "bskt contract should have zero ETH balance");

    // Check WETH balance of the bskt contract
    const wethBalance = await wETH.balanceOf(newbsktAddress);
    expect(wethBalance).to.equal(
      0,
      "bskt contract should have zero WETH balance"
    );
    // Check mt token balances of the bskt contract
    const mtTokenBalance = await mtToken.balanceOf(newbsktAddress);
    expect(mtTokenBalance).to.equal(
      0,
      "bskt contract should have zero MT token balance"
    );

    // Check alva token balances of the bskt contract
    const alvaTokenBalance = await alva.balanceOf(newbsktAddress);
    expect(alvaTokenBalance).to.equal(
      0,
      "bskt contract should have zero ALVA token balance"
    );
  });

  it("should contribute (without fee) to bskt and verify its balances remain zero", async function () {
    // Setting All fee to be 0%
    await expect(factory.setPlatformFeeConfig(0, 0, 0))
      .to.emit(factory, "PlatformFeesUpdated")
      .withArgs(0, 0, 0);

    // Create a bskt first
    const name = "Contribute-Balance-Test";
    const symbol = "CBT";
    const tokens = [mtTokenAddress, alvaAddress];
    const weights = ["5000", "5000"]; // 50% each
    const tokenURI = "https://my-nft.test.metadata.com";
    const buffer = 100; // 1%
    const _id = "contribute-balance-test";
    const description = "This is a test bskt for contribution balance testing";

    // Create a new bskt
    const createbsktTx = await factory.createBSKT(
      name,
      symbol,
      tokens,
      weights,
      tokenURI,
      buffer,
      _id,
      description,
      calculateDeadline(20),
      { value: ethers.parseEther("1") }
    );

    // Get the bskt and bsktPair addresses from the event
    const receipt = await createbsktTx.wait();

    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "BSKTCreated") {
          newbsktAddress = parsedLog.args.bskt;
          newbsktPairAddress = parsedLog.args.bsktPair;
          break;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Get the new bskt contract instance
    const newbskt = await ethers.getContractAt(
      "BasketTokenStandard",
      newbsktAddress
    );

    // Check the ETH balance of the bskt contract before contribution
    const ethBalanceBefore = await ethers.provider.getBalance(newbsktAddress);
    const wethBalanceBefore = await wETH.balanceOf(newbsktAddress);
    const mtTokenBalanceBefore = await mtToken.balanceOf(newbsktAddress);
    const alvaTokenBalanceBefore = await alva.balanceOf(newbsktAddress);

    expect(ethBalanceBefore).to.equal(
      0,
      "bskt contract should have zero ETH balance before contribution"
    );

    expect(wethBalanceBefore).to.equal(
      0,
      "bskt contract should have zero WETH balance before contribution"
    );
    expect(mtTokenBalanceBefore).to.equal(
      0,
      "bskt contract should have zero MT token balance before contribution"
    );
    expect(alvaTokenBalanceBefore).to.equal(
      0,
      "bskt contract should have zero ALVA token balance before contribution"
    );

    // Contribute to the bskt
    const contributeTx = await newbskt
      .connect(user1)
      .contribute(buffer, calculateDeadline(20), {
        value: ethers.parseEther("0.5"),
      });
    const contributeReceipt = await contributeTx.wait();

    // Check for PlatformFeeDeducted event
    let feePaidEvent = null;
    for (const log of contributeReceipt.logs) {
      try {
        const parsedLog = newbskt.interface.parseLog(log);
        if (parsedLog?.name === "PlatformFeeDeducted") {
          feePaidEvent = parsedLog;
          break;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    expect(feePaidEvent).to.be.null;

    // Check the ETH balance of the bskt contract after contribution
    const bsktBalanceAfter = await ethers.provider.getBalance(newbsktAddress);
    const wethBalanceAfter = await wETH.balanceOf(newbsktAddress);
    const mtTokenBalanceAfter = await mtToken.balanceOf(newbsktAddress);
    const alvaTokenBalanceAfter = await alva.balanceOf(newbsktAddress);

    expect(bsktBalanceAfter).to.equal(
      0,
      "bskt contract should have zero ETH balance after contribution"
    );

    expect(wethBalanceAfter).to.equal(
      0,
      "bskt contract should have zero WETH balance after contribution"
    );
    expect(mtTokenBalanceAfter).to.equal(
      0,
      "bskt contract should have zero MT token balance after contribution"
    );
    expect(alvaTokenBalanceAfter).to.equal(
      0,
      "bskt contract should have zero ALVA token balance after contribution"
    );
  });

  it("should withdraw ETH (without fee)  from bskt and verify its balances remain zero", async function () {
    // Setting All fee to be 0%
    await expect(factory.setPlatformFeeConfig(0, 0, 0))
      .to.emit(factory, "PlatformFeesUpdated")
      .withArgs(0, 0, 0);

    // Create a bskt first
    const name = "Withdraw-Balance-Test";
    const symbol = "WBT";
    const tokens = [mtTokenAddress, alvaAddress];
    const weights = ["5000", "5000"]; // 50% each
    const tokenURI = "https://my-nft.test.metadata.com";
    const buffer = 100; // 1%
    const _id = "withdraw-balance-test";
    const description = "This is a test bskt for withdrawal balance testing";

    // Create a new bskt
    const createbsktTx = await factory.createBSKT(
      name,
      symbol,
      tokens,
      weights,
      tokenURI,
      buffer,
      _id,
      description,
      calculateDeadline(20),
      { value: ethers.parseEther("1") }
    );

    // Get the bskt and bsktPair addresses from the event
    const receipt = await createbsktTx.wait();

    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "BSKTCreated") {
          newbsktAddress = parsedLog.args.bskt;
          newbsktPairAddress = parsedLog.args.bsktPair;
          break;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Get the new bskt and bsktPair contract instances
    const newbskt = await ethers.getContractAt(
      "BasketTokenStandard",
      newbsktAddress
    );
    const newbsktPair = await ethers.getContractAt(
      "BasketTokenStandardPair",
      newbsktPairAddress
    );

    // Check the ETH balance of the bskt contract after creation
    const ethBalanceAfterCreation = await ethers.provider.getBalance(
      newbsktAddress
    );
    const wethBalanceAfterCreation = await wETH.balanceOf(newbsktAddress);
    const mtTokenBalanceAfterCreation = await mtToken.balanceOf(newbsktAddress);
    const alvaTokenBalanceAfterCreation = await alva.balanceOf(newbsktAddress);

    expect(ethBalanceAfterCreation).to.equal(
      0,
      "bskt contract should have zero ETH balance after creation"
    );
    expect(wethBalanceAfterCreation).to.equal(
      0,
      "bskt contract should have zero WETH balance after creation"
    );
    expect(mtTokenBalanceAfterCreation).to.equal(
      0,
      "bskt contract should have zero MT token balance after creation"
    );
    expect(alvaTokenBalanceAfterCreation).to.equal(
      0,
      "bskt contract should have zero ALVA token balance after creation"
    );

    // Get owner's LP token balance (owner created the bskt and received LP tokens)
    const ownerLpBalance = await newbsktPair.balanceOf(owner.address);
    expect(ownerLpBalance).to.be.gt(
      0,
      "Owner should have LP tokens after bskt creation"
    );

    // Approve bskt to spend LP tokens
    await newbsktPair.connect(owner).approve(newbsktAddress, ownerLpBalance);

    // Withdraw ETH from the bskt
    const withdrawTx = await newbskt
      .connect(owner)
      .withdrawETH(ownerLpBalance, buffer, calculateDeadline(20));
    const withdrawReceipt = await withdrawTx.wait();

    // Check for PlatformFeeDeducted event
    let feePaidEvent = null;
    for (const log of withdrawReceipt.logs) {
      try {
        const parsedLog = newbskt.interface.parseLog(log);
        if (parsedLog?.name === "PlatformFeeDeducted") {
          feePaidEvent = parsedLog;
          break;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    expect(feePaidEvent).to.be.null;

    // Check the ETH balance of the bskt contract after withdrawal
    const ethBalanceAfter = await ethers.provider.getBalance(newbsktAddress);
    expect(ethBalanceAfter).to.equal(
      0,
      "bskt contract should have zero ETH balance after withdrawal"
    );

    // Check token balances after withdrawal
    const wethBalanceAfterWithdraw = await wETH.balanceOf(newbsktAddress);
    const mtTokenBalanceAfterWithdraw = await mtToken.balanceOf(newbsktAddress);
    const alvaTokenBalanceAfterWithdraw = await alva.balanceOf(newbsktAddress);

    expect(wethBalanceAfterWithdraw).to.equal(
      0,
      "bskt contract should have zero WETH balance after withdrawal"
    );
    expect(mtTokenBalanceAfterWithdraw).to.equal(
      0,
      "bskt contract should have zero MT token balance after withdrawal"
    );
    expect(alvaTokenBalanceAfterWithdraw).to.equal(
      0,
      "bskt contract should have zero ALVA token balance after withdrawal"
    );
  });

  // it("should withdraw (without fee) tokens from bskt and verify its balances remain zero", async function () {
  //   // Setting All fee to be 0%
  //   await expect(factory.setPlatformFeeConfig(0, 0, 0))
  //     .to.emit(factory, "PlatformFeesUpdated")
  //     .withArgs(0, 0, 0);

  //   // Create a bskt first
  //   const name = "Withdraw-Tokens-Balance-Test";
  //   const symbol = "WTBT";
  //   const tokens = [mtTokenAddress, alvaAddress];
  //   const weights = ["5000", "5000"]; // 50% each
  //   const tokenURI = "https://my-nft.test.metadata.com";
  //   const buffer = 100; // 1%
  //   const _id = "withdraw-tokens-balance-test";
  //   const description =
  //     "This is a test bskt for token withdrawal balance testing";

  //   // Create a new bskt
  //   const createbsktTx = await factory.createBSKT(
  //     name,
  //     symbol,
  //     tokens,
  //     weights,
  //     tokenURI,
  //     buffer,
  //     _id,
  //     description,
  //     calculateDeadline(20),
  //     { value: ethers.parseEther("1") }
  //   );

  //   // Get the bskt and bsktPair addresses from the event
  //   const receipt = await createbsktTx.wait();

  //   for (const log of receipt.logs) {
  //     try {
  //       const parsedLog = factory.interface.parseLog(log);
  //       if (parsedLog?.name === "BSKTCreated") {
  //         newbsktAddress = parsedLog.args.bskt;
  //         newbsktPairAddress = parsedLog.args.bsktPair;
  //         break;
  //       }
  //     } catch (error) {
  //       // Ignore parsing errors
  //     }
  //   }

  //   // Get the new bskt and bsktPair contract instances
  //   const newbskt = await ethers.getContractAt(
  //     "BasketTokenStandard",
  //     newbsktAddress
  //   );
  //   const newbsktPair = await ethers.getContractAt(
  //     "BasketTokenStandardPair",
  //     newbsktPairAddress
  //   );

  //   // Check the ETH balance of the bskt contract after creation
  //   const ethBalanceAfterCreation = await ethers.provider.getBalance(
  //     newbsktAddress
  //   );
  //   const wethBalanceAfterCreation = await wETH.balanceOf(newbsktAddress);
  //   const mtTokenBalanceAfterCreation = await mtToken.balanceOf(newbsktAddress);
  //   const alvaTokenBalanceAfterCreation = await alva.balanceOf(newbsktAddress);

  //   expect(ethBalanceAfterCreation).to.equal(
  //     0,
  //     "bskt contract should have zero ETH balance after creation"
  //   );
  //   expect(wethBalanceAfterCreation).to.equal(
  //     0,
  //     "bskt contract should have zero WETH balance after creation"
  //   );
  //   expect(mtTokenBalanceAfterCreation).to.equal(
  //     0,
  //     "bskt contract should have zero MT token balance after creation"
  //   );
  //   expect(alvaTokenBalanceAfterCreation).to.equal(
  //     0,
  //     "bskt contract should have zero ALVA token balance after creation"
  //   );

  //   // Get owner's LP token balance (owner created the bskt and received LP tokens)
  //   const ownerLpBalance = await newbsktPair.balanceOf(owner.address);
  //   expect(ownerLpBalance).to.be.gt(
  //     0,
  //     "Owner should have LP tokens after bskt creation"
  //   );

  //   // Approve bskt to spend LP tokens
  //   await newbsktPair.connect(owner).approve(newbsktAddress, ownerLpBalance);

  //   // Withdraw tokens from the bskt (not ETH)
  //   const withdrawTx = await newbskt
  //     .connect(owner)
  //     .withdraw(ownerLpBalance, 100, calculateDeadline(20));
  //   const withdrawReceipt = await withdrawTx.wait();

  //   // Check for PlatformFeeDeducted event
  //   let feePaidEvent = null;
  //   for (const log of withdrawReceipt.logs) {
  //     try {
  //       const parsedLog = newbskt.interface.parseLog(log);
  //       if (parsedLog?.name === "PlatformFeeDeducted") {
  //         feePaidEvent = parsedLog;
  //         break;
  //       }
  //     } catch (error) {
  //       // Ignore parsing errors
  //     }
  //   }

  //   expect(feePaidEvent).to.be.null;

  //   // Check the ETH balance of the bskt contract after withdrawal
  //   const ethBalanceAfter = await ethers.provider.getBalance(newbsktAddress);
  //   expect(ethBalanceAfter).to.equal(
  //     0,
  //     "bskt contract should have zero ETH balance after withdrawal"
  //   );

  //   // Check token balances after withdrawal
  //   const wethBalanceAfterWithdraw = await wETH.balanceOf(newbsktAddress);
  //   const mtTokenBalanceAfterWithdraw = await mtToken.balanceOf(newbsktAddress);
  //   const alvaTokenBalanceAfterWithdraw = await alva.balanceOf(newbsktAddress);

  //   expect(wethBalanceAfterWithdraw).to.equal(
  //     0,
  //     "bskt contract should have zero WETH balance after withdrawal"
  //   );
  //   expect(mtTokenBalanceAfterWithdraw).to.equal(
  //     0,
  //     "bskt contract should have zero MT token balance after withdrawal"
  //   );
  //   expect(alvaTokenBalanceAfterWithdraw).to.equal(
  //     0,
  //     "bskt contract should have zero ALVA token balance after withdrawal"
  //   );
  // });

  it("should revert when sending ETH directly to bskt from User with UnauthorizedSender", async function () {
    // Create a bskt and get its address
    const tx = await factory.createBSKT(
      "UnauthorizedSender-Test",
      "UST",
      [mtTokenAddress, alvaAddress],
      ["5000", "5000"],
      "https://unauth.test.uri",
      100,
      "unauth-bskt",
      "Test UnauthorizedSender revert on receive",
      calculateDeadline(20),
      { value: ethers.parseEther("1") }
    );
    const receipt = await tx.wait();
    let newbsktAddress;
    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "BSKTCreated") {
          newbsktAddress = parsedLog.args.bskt;
          break;
        }
      } catch {}
    }
    // Expect revert on direct ETH send (consistent with other tests)
    await expect(
      user1.sendTransaction({
        to: newbsktAddress,
        value: ethers.parseEther("0.01")
      })
    ).to.be.reverted;
  });
});
