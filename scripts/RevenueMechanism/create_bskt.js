const { ethers } = require("hardhat");

async function main() {
  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Constants - Update these values as needed
  const FACTORY_ADDRESS = "0xd94eD3A0b985909B294fe4Ec91e51A06ebd3D27D"; // Factory proxy address
  const ALVA_ADDRESS = "0x960545D39568423B7e707a2A16d61408a5b9Bf82"; // ALVA token address
  const WETH_ADDRESS = "0x57112DD160Ee9A8E2722DCcF1d977B530Ff61a17"; // WETH address

  // BSKT Creation Parameters
  const BSKT_PARAMS = {
    name: "Fee Demo Basket",
    symbol: "FEEDEMO",
    tokens: [ALVA_ADDRESS, WETH_ADDRESS],
    weights: [5000, 5000], // 50% ALVA, 50% WETH (must add up to 10000)
    tokenURI: "https://token-uri.com/fee-demo",
    buffer: 50, // 0.5% buffer
    id: "fee-demo-basket-" + Date.now(), // Unique ID
    description: "A basket token demonstrating fee deduction mechanisms",
    deadline: Math.floor(Date.now() / 1000) + 20 * 60,
  };

  // Amount of ETH to send for BSKT creation
  const creationAmount = ethers.parseEther("0.05"); // 0.05 ETH

  // Get Factory contract instance
  console.log("\n1. Connecting to Factory contract...");
  const factory = await ethers.getContractAt(
    "Factory",
    FACTORY_ADDRESS,
    signer
  );

  // Step 2: Check min creation amount
  console.log("\n2. Checking minimum BSKT creation amount...");
  const minCreationAmount = await factory.minBSKTCreationAmount();
  console.log(
    `   Minimum Creation Amount: ${ethers.formatEther(minCreationAmount)} ETH`
  );

  if (creationAmount < minCreationAmount) {
    console.error(
      `   ERROR: Creation amount (${ethers.formatEther(
        creationAmount
      )} ETH) is less than minimum required (${ethers.formatEther(
        minCreationAmount
      )} ETH)`
    );
    return;
  }

  // Step 3: Get platform fee configuration
  console.log("\n3. Getting platform fee configuration...");
  const feeConfig = await factory.getPlatformFeeConfig();

  // Convert fee values to numbers for display
  const creationFeePercent = Number(feeConfig.bsktCreationFee) / 100;
  const contributionFeePercent = Number(feeConfig.contributionFee) / 100;
  const withdrawalFeePercent = Number(feeConfig.withdrawalFee) / 100;

  console.log(`   BSKT Creation Fee: ${creationFeePercent}%`);
  console.log(`   Contribution Fee: ${contributionFeePercent}%`);
  console.log(`   Withdrawal Fee: ${withdrawalFeePercent}%`);
  console.log(`   Fee Collector: ${feeConfig.feeCollector}`);

  // Calculate expected fee amount using BigInt
  const feeRate = BigInt(feeConfig.bsktCreationFee);
  const expectedFeeAmount = (creationAmount * feeRate) / BigInt(10000);
  console.log(
    `   Expected Fee Amount: ${ethers.formatEther(expectedFeeAmount)} ETH`
  );

  // Step 4: Create BSKT
  console.log("\n4. Creating BSKT...");
  console.log(`   Name: ${BSKT_PARAMS.name}`);
  console.log(`   Symbol: ${BSKT_PARAMS.symbol}`);
  console.log(`   Tokens: ${BSKT_PARAMS.tokens}`);
  console.log(`   Weights: ${BSKT_PARAMS.weights}`);
  console.log(`   Creation Amount: ${ethers.formatEther(creationAmount)} ETH`);

  try {
    console.log("\n   Sending transaction to create BSKT...");
    const tx = await factory.createBSKT(
      BSKT_PARAMS.name,
      BSKT_PARAMS.symbol,
      BSKT_PARAMS.tokens,
      BSKT_PARAMS.weights,
      BSKT_PARAMS.tokenURI,
      BSKT_PARAMS.buffer,
      BSKT_PARAMS.id,
      BSKT_PARAMS.description,
      BSKT_PARAMS.deadline,
      { value: creationAmount, gasLimit: 5000000 } // Higher gas limit for complex operations
    );

    console.log(`   Transaction hash: ${tx.hash}`);
    console.log("\n   Waiting for transaction confirmation...");

    const receipt = await tx.wait();
    console.log(`   Transaction confirmed in block ${receipt.blockNumber}`);

    // Find the CreatedBSKT event in the logs
    const createdBSKTEvent = receipt.logs
      .filter(
        (log) =>
          log.topics[0] === factory.interface.getEvent("CreatedBSKT").topicHash
      )
      .map((log) => factory.interface.parseLog(log))[0];

    if (createdBSKTEvent) {
      console.log("\n5. BSKT Creation Successful!");
      console.log(`   BSKT Address: ${createdBSKTEvent.args.bskt}`);
      console.log(`   BSKT Pair Address: ${createdBSKTEvent.args.bsktPair}`);
      console.log(`   Creator: ${createdBSKTEvent.args.creator}`);
      console.log(
        `   Amount Used: ${ethers.formatEther(createdBSKTEvent.args.amount)} ETH`
      );
      console.log(
        `   Fee Amount: ${ethers.formatEther(
          createdBSKTEvent.args.feeAmount
        )} ETH`
      );

      // Get BSKT contract instance
      const bskt = await ethers.getContractAt(
        "BasketTokenStandard",
        createdBSKTEvent.args.bskt,
        signer
      );
      const bsktPair = await ethers.getContractAt(
        "BasketTokenStandardPair",
        createdBSKTEvent.args.bsktPair,
        signer
      );

      // Get LP token balance
      const lpBalance = await bsktPair.balanceOf(signer.address);
      console.log(
        `   LP Token Balance: ${ethers.formatEther(lpBalance)} tokens`
      );

      // Get BSKT token balance
      const bsktBalance = await bskt.balanceOf(signer.address);
      console.log(
        `   BSKT Token Balance: ${ethers.formatEther(bsktBalance)} tokens`
      );
    } else {
      console.log("\n5. Could not find CreatedBSKT event in logs");
    }
  } catch (error) {
    console.error("\n   Error creating BSKT:", error);
    if (error.data) {
      console.error("   Error data:", error.data);
    }
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
