import { getFirst30Buyers } from './getFirst30Buyers';
import { getWalletTokens } from './getWalletTokens';
import { connectToDatabase, disconnectFromDatabase } from './db';

async function main() {
    await connectToDatabase();

    const tokenAddress = 'KENJSUYLASHUMfHyy5o4Hp2FdNqZg1AsUPhfH2kYvEP';
    const buyers = await getFirst30Buyers(tokenAddress);

    for (const buyer of buyers) {
        await getWalletTokens(buyer, tokenAddress);
    }

    console.log('✅ All data saved to PostgreSQL');
    await disconnectFromDatabase();
}

// Run the Script
main().catch(err => console.error('❌ Error in main execution:', err));
