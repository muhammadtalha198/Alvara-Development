const { ethers, run, network } = require("hardhat");

async function main() {
    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    // Contract addresses
    const BSKT_PROXY_ADDRESS = "0xaa11418588A283Ee3E17e6E5ece87F81f88ad96F";
    const BSKT_PAIR_ADDRESS = "0x0E067D8161E95eaFcb67B337f094f86601B1f1B3";
    
    console.log("\nBSKT Contract Information:");
    console.log("-------------------------");
    console.log("BSKT Proxy Address:", BSKT_PROXY_ADDRESS);
    console.log("BSKT Pair Address:", BSKT_PAIR_ADDRESS);
    
    // Get the BSKT contract instance
    try {
        const bskt = await ethers.getContractAt("BasketTokenStandard", BSKT_PROXY_ADDRESS, signer);
        
        // Get some data from the BSKT contract to verify it's working
        const name = await bskt.name();
        const symbol = await bskt.symbol();
        const bsktPair = await bskt.bsktPair();
        
        console.log("\nBSKT Contract Data:");
        console.log("Name:", name);
        console.log("Symbol:", symbol);
        console.log("BSKT Pair Address:", bsktPair);
        console.log("✅ BSKT contract is accessible and working!");
    } catch (error) {
        console.error("Error accessing BSKT contract:", error);
    }
    
    // Verify the BSKT proxy contract
    try {
        console.log("\nVerifying BSKT Proxy Contract...");
        await run("verify:verify", {
            address: BSKT_PROXY_ADDRESS,
            constructorArguments: [],
        });
        console.log("BSKT Proxy verification successful!");
    } catch (error) {
        if (error.message.includes("already verified")) {
            console.log("BSKT Proxy is already verified!");
        } else {
            console.error("Error verifying BSKT Proxy:", error);
        }
    }
    
    // Verify the BSKT Pair contract
    try {
        console.log("\nVerifying BSKT Pair Contract...");
        await run("verify:verify", {
            address: BSKT_PAIR_ADDRESS,
            constructorArguments: [],
        });
        console.log("BSKT Pair verification successful!");
    } catch (error) {
        if (error.message.includes("already verified")) {
            console.log("BSKT Pair is already verified!");
        } else {
            console.error("Error verifying BSKT Pair:", error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
