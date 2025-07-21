const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");

describe("Factory", () => {
  it("Should initialize with right parameters", async () => {
    const [owner, deployer] = await ethers.getSigners();

    const wethHolderAddress = "0x8EB8a3b98659Cce290402893d0123abb75E3ab28";
    const uniswapRouterAddress = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    const WETH = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
    const DAI = "0x69e1E3Ecb93acb8271d4392D71a04076c22d799a";
    const USDT = "0xC3121820dEB161CFBe30e3855790fDcd1084d3f6";
    const USDC = "0xc07268AC290065A04fe11a4a1b7C85F59Bd28265";

    const weth = await ethers.getContractAt("IERC20Upgradeable", WETH);
    const dai = await ethers.getContractAt("IERC20Upgradeable", DAI);
    const usdt = await ethers.getContractAt("IERC20Upgradeable", USDT);
    const usdc = await ethers.getContractAt("IERC20Upgradeable", USDC);

    const bskt1 = await (await ethers.getContractFactory("BasketTokenStandard")).deploy();
    console.log("bskt", bskt1.address);

    const bsktPair1 = await (await ethers.getContractFactory("BasketTokenStandardPair")).deploy();
    console.log("bsktPair1", bsktPair1.address);

    // Deploy the Factory contract directly since it's not upgradeable in the standard way
    // due to the constructor disabling initializers
    const FactoryFactory = await ethers.getContractFactory("Factory");
    const factory = await FactoryFactory.deploy();
    
    // Now initialize the factory after deployment
    await factory.initialize(
      dai.address,
      500,
      bskt1.address,
      bsktPair1.address,
      "833333333333333", // monthlyFee
      deployer.address, // royaltyReceiver
      "ipfs://test", // collectionUri
      deployer.address, // feeCollector
      deployer.address, // defaultMarketplace
      uniswapRouterAddress, // routerAddress
      WETH, // wethAddress
      ethers.parseEther("0.01") // minBSKTCreationAmount
    );
    console.log("factory", factory.address);

    await factory.createBSKT(
      "hi",
      "HI",
      [dai.address],
      [10000],
      "Test",
      false,
      4500,
      "Test Description",
      {
        value: ethers.utils.parseEther("1"),
      }
    );

    const bsktAddress = await factory.ownerTobskt(owner.address, 0);
    console.log("bskt address", bsktAddress);
    const bskt = await ethers.getContractAt("BasketTokenStandard", bsktAddress);
    console.log("bskt", bskt.address);

    console.log("Owner bskt count", await bskt.balanceOf(owner.address));

    const bsktPairAddress = await bskt.bsktPair();
    const bsktPair = await ethers.getContractAt(
      "BasketTokenStandardPair",
      bsktPairAddress
    );
    console.log("owner of bskt Pair", await bsktPair.owner());
    console.log("bskt Pair", bsktPair.address);
    console.log(
      "LP tokens after minting",
      await bsktPair.balanceOf(owner.address)
    );

    console.log(
      "\nBalance of DAI on bskt Pair and Owner",
      (await dai.balanceOf(bsktPair.address)) / 1e18,
      (await dai.balanceOf(owner.address)) / 1e18
    );
    console.log(
      "Balance of USDT on bskt and Owner",
      (await usdt.balanceOf(bsktPair.address)) / 1e6,
      (await usdt.balanceOf(owner.address)) / 1e6
    );
    console.log(
      "Balance of USDC on bskt Pair and Owner",
      (await usdc.balanceOf(bsktPair.address)) / 1e6,
      (await usdc.balanceOf(owner.address)) / 1e6
    );

    console.log(
      "calculate the share of LP",
      await bsktPair.calculateShareLP(ethers.utils.parseEther("1"))
    );
    console.log(
      "calculate the share of ETH",
      await bsktPair.calculateShareETH(ethers.utils.parseEther("1"))
    );
    console.log(
      "calculate the share of tokens",
      await bsktPair.calculateShareTokens(ethers.utils.parseEther("1"))
    );

    await bskt.contribute(1000, { value: ethers.utils.parseEther("1") });
    console.log(
      "LP tokens after contribution",
      await bsktPair.balanceOf(owner.address)
    );

    console.log(
      "\nBalance of DAI on bskt Pair and Owner after Contribute",
      (await dai.balanceOf(bsktPair.address)) / 1e18,
      (await dai.balanceOf(owner.address)) / 1e18
    );
    console.log(
      "Balance of USDT on bskt Pair and Owner after Contribute",
      (await usdt.balanceOf(bsktPair.address)) / 1e6,
      (await usdt.balanceOf(owner.address)) / 1e6
    );
    console.log(
      "Balance of USDC on bskt Pair and Owner after Contribute",
      (await usdc.balanceOf(bsktPair.address)) / 1e6,
      (await usdc.balanceOf(owner.address)) / 1e6
    );

    await bsktPair.approve(bskt.address, await bsktPair.balanceOf(owner.address));

    console.log(
      "\nBefore balance of WETH on Owner after Withdraw",
      (await weth.balanceOf(owner.address)) / 1e18
    );

    await bskt.withdrawETH(ethers.utils.parseEther("100"), 1000);

    console.log(
      "After balance of WETH on Owner after Withdraw",
      (await weth.balanceOf(owner.address)) / 1e18
    );

    // await bskt.withdraw(ethers.utils.parseEther("100"));

    // console.log(
    //   "\nBalance of DAI on bskt Pair and Owner after Withdraw",
    //   (await dai.balanceOf(bsktPair.address)) / 1e18,
    //   (await dai.balanceOf(owner.address)) / 1e18
    // );
    console.log(
      "Balance of USDT on bskt Pair and Owner after Withdraw",
      (await usdt.balanceOf(bsktPair.address)) / 1e6,
      (await usdt.balanceOf(owner.address)) / 1e6
    );
    console.log(
      "Balance of USDC on bskt Pair and Owner after Withdraw",
      (await usdc.balanceOf(bsktPair.address)) / 1e6,
      (await usdc.balanceOf(owner.address)) / 1e6
    );

    console.log(
      "balance of eth after",
      await ethers.provider.getBalance(owner.address)
    );

    console.log("balance on bskt Pair", await usdc.balanceOf(bsktPair.address));

    await dai.approve(uniswapRouterAddress, ethers.utils.parseEther("1000"));
    await usdc.approve(uniswapRouterAddress, ethers.utils.parseEther("1000"));
    await usdc.approve(uniswapRouterAddress, ethers.utils.parseEther("1000"));

    await bskt.rebalance(
      [dai.address, usdc.address, usdt.address],
      [7000, 2000, 1000],
      1000
    );

    await bskt.contribute(1000, { value: ethers.utils.parseEther("1") });
    console.log(
      "LP tokens after contribution",
      await bsktPair.balanceOf(owner.address)
    );

    console.log(
      "\nBalance of DAI on bskt Pair and Owner after Rebalance",
      (await dai.balanceOf(bsktPair.address)) / 1e18,
      (await dai.balanceOf(owner.address)) / 1e18
    );
    console.log(
      "Balance of USDT on bskt Pair and Owner after Rebalance",
      (await usdt.balanceOf(bsktPair.address)) / 1e6,
      (await usdt.balanceOf(owner.address)) / 1e6
    );
    console.log(
      "Balance of USDC on bskt Pair and Owner after Rebalance",
      (await usdc.balanceOf(bsktPair.address)) / 1e6,
      (await usdc.balanceOf(owner.address)) / 1e6
    );

    // await bskt.withdraw(ethers.utils.parseEther("100"));

    // console.log(
    //   "\nBalance of DAI on bskt Pair and Owner after Withdraw",
    //   (await dai.balanceOf(bsktPair.address)) / 1e18,
    //   (await dai.balanceOf(owner.address)) / 1e18
    // );
    console.log(
      "Balance of USDT on bskt Pair and Owner after Withdraw",
      (await usdt.balanceOf(bsktPair.address)) / 1e6,
      (await usdt.balanceOf(owner.address)) / 1e6
    );
    console.log(
      "Balance of USDC on bskt Pair and Owner after Withdraw",
      (await usdc.balanceOf(bsktPair.address)) / 1e6,
      (await usdc.balanceOf(owner.address)) / 1e6
    );

    await bskt.updateUpperLimit(1);
    await bskt.updateLowerLimit(1);
  });
});
