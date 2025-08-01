const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

describe.only("Reentrancy Guard Test", function () {
  let owner, user1, user2;
  let bskt, bsktPair, factory, wETH, alva, mtToken, router;
  let bsktAddress,
    bsktPairAddress,
    factoryAddress,
    wETHAddress,
    alvaAddress,
    mtTokenAddress,
    routerAddress;
  let attacker; // The malicious contract

  const name = "Reentrancy-Test-Token";
  const symbol = "RTT";
  const tokenURI = "https://my-nft.test.metadata.com";
  const description = "This is a test BSKT for reentrancy testing";
  const buffer = 100; // 1%
  const _id = "reentrancy-test-bskt";

  // Calculate Deadline
  function calculateDeadline(minutes = 20) {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const buffer = minutes * 60; // Convert minutes to seconds
    return currentTime + buffer;
  }

  beforeEach(async function () {
    // Get signers
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

    await factory.grantRole(await factory.ADMIN_ROLE(), owner.address);
    await factory.grantRole(await factory.FEE_MANAGER_ROLE(), owner.address);
    await factory.grantRole(await factory.WHITELIST_MANAGER_ROLE(), owner.address);
    await factory.grantRole(await factory.UPGRADER_ROLE(), owner.address);
    await factory.grantRole(await factory.URI_MANAGER_ROLE(), owner.address);


    // Set ALVA listing timestamp
    await alva.setListingTimestamp("100");

    // Deploy the attacker contract
    const ReentrancyAttacker = await ethers.getContractFactory(
      "ReentrancyAttacker"
    );
    attacker = await ReentrancyAttacker.deploy();
    await attacker.waitForDeployment();

    // Set up token array
    const tokens = [mtTokenAddress, alvaAddress];
    const weights = ["5000", "5000"]; // 50% each

    // Create a new BSKT
    const createBSKTTx = await factory.createBSKT(
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

    // Get the BSKT and BSKTPair addresses from the event
    const receipt = await createBSKTTx.wait();
    let newBsktAddress, newBsktPairAddress;

    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "BSKTCreated") {
          newBsktAddress = parsedLog.args.bskt;
          newBsktPairAddress = parsedLog.args.bsktPair;
          break;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Update contract instances with the new addresses
    bskt = await ethers.getContractAt("BasketTokenStandard", newBsktAddress);
    bsktPair = await ethers.getContractAt(
      "BasketTokenStandardPair",
      newBsktPairAddress
    );
    bsktAddress = newBsktAddress;
    bsktPairAddress = newBsktPairAddress;

    // Set user2 as the fee collector
    await factory.setFeeCollector(user2.address);
  });

  it("should prevent reentrancy attacks on contribute function", async function () {
    // Set up the attacker contract with the BSKT address
    const attackerAddress = await attacker.getAddress();
    await attacker.setBSKTAddress(bsktAddress);

    // Try to perform a reentrancy attack via contribute
    await attacker.attackContribute(buffer, calculateDeadline(20), {
      value: ethers.parseEther("0.5"),
    });

    // Check that the attack failed (the reentrancy attempt didn't succeed)
    expect(await attacker.attackSucceeded()).to.be.false;
  });

  it("should prevent reentrancy attacks on withdraw function", async function () {
    // Contribute to the BSKT to get LP tokens
    await bskt.contribute(buffer, calculateDeadline(20), {
      value: ethers.parseEther("0.5"),
    });

    // Get owner's LP token balance
    const ownerLpBalance = await bsktPair.balanceOf(owner.address);
    expect(ownerLpBalance).to.be.gt(
      0,
      "Owner should have LP tokens after contribution"
    );

    // Get attacker address
    const attackerAddress = await attacker.getAddress();

    // Transfer some LP tokens to the attacker contract
    await bsktPair.transfer(attackerAddress, ownerLpBalance / 2n);

    // Verify the attacker received the LP tokens
    const attackerLpBalance = await bsktPair.balanceOf(attackerAddress);
    expect(attackerLpBalance).to.be.gt(
      0,
      "Attacker should have received LP tokens"
    );

    // Set up the attacker contract with the BSKT address
    await attacker.setBSKTAddress(bsktAddress);
    await attacker.setBSKTPairAddress(bsktPairAddress);

    // Try to perform a reentrancy attack via withdraw
    await attacker.attackWithdraw(calculateDeadline(20));

    // Check that the attack failed (the reentrancy attempt didn't succeed)
    expect(await attacker.attackSucceeded()).to.be.false;
  });

  it("should prevent reentrancy attacks on withdrawETH function", async function () {
    // Contribute to the BSKT to get LP tokens
    await bskt.contribute(buffer, calculateDeadline(20), {
      value: ethers.parseEther("0.5"),
    });

    // Get owner's LP token balance
    const ownerLpBalance = await bsktPair.balanceOf(owner.address);
    expect(ownerLpBalance).to.be.gt(
      0,
      "Owner should have LP tokens after contribution"
    );

    // Get attacker address
    const attackerAddress = await attacker.getAddress();

    // Transfer some LP tokens to the attacker contract
    await bsktPair.transfer(attackerAddress, ownerLpBalance / 2n);

    // Verify the attacker received the LP tokens
    const attackerLpBalance = await bsktPair.balanceOf(attackerAddress);
    expect(attackerLpBalance).to.be.gt(
      0,
      "Attacker should have received LP tokens"
    );

    // Set up the attacker contract with the BSKT address
    await attacker.setBSKTAddress(bsktAddress);
    await attacker.setBSKTPairAddress(bsktPairAddress);

    // Try to perform a reentrancy attack via withdrawETH
    await attacker.attackWithdrawETH(buffer, calculateDeadline(20));

    // Check that the attack failed (the reentrancy attempt didn't succeed)
    expect(await attacker.attackSucceeded()).to.be.false;
  });
});
