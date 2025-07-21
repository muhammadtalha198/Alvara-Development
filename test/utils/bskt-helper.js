const { ethers } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

const createBSKTAndGetInstance = async (
  factory,
  user,
  name,
  symbol,
  tokenAddresses,
  weights,
  tokenURI,
  buffer,
  id,
  description,
  autoRebalance,
  price
) => {
  const bsktDetails = {
    name: name,
    symbol: symbol,
    tokens: tokenAddresses,
    weights: weights,
    tokenURI: tokenURI,
    autoRebalance: autoRebalance,
    buffer: buffer,
    id: id,
    description: description,
  };

  const tx = await factory
    .connect(user)
    .createBSKT(
      bsktDetails.name,
      bsktDetails.symbol,
      bsktDetails.tokens,
      bsktDetails.weights,
      bsktDetails.tokenURI,
      bsktDetails.buffer,
      bsktDetails.id,
      bsktDetails.description,
      calculateDeadline(20),
      { value: ethers.parseEther(price) }
    );

  const receipt = await tx.wait();
  let createdBSKTAddress = null;

  for (const log of receipt.logs) {
    try {
      const parsedLog = factory.interface.parseLog(log);
      if (parsedLog.name === "BSKTCreated") {
        createdBSKTAddress = parsedLog.args.bskt;
        break;
      }
    } catch {}
  }

  const bsktInstance = await ethers.getContractAt(
    "BasketTokenStandard",
    createdBSKTAddress
  );
  return bsktInstance;
};

// Reusable function to increase time by seconds
const increaseTimeBy = async (seconds) => {
  await time.increase(seconds);
  await mine();
};

// Calculate Deadline
function calculateDeadline(minutes = 20) {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  const buffer = minutes * 60; // Convert minutes to seconds
  return currentTime + buffer;
}

module.exports = { createBSKTAndGetInstance, increaseTimeBy, calculateDeadline };
// For backward compatibility
module.exports.createbsktAndGetInstance = createBSKTAndGetInstance;
