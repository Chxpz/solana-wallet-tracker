import { Connection, PublicKey } from '@solana/web3.js';
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import db from './db';

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const getFirst30Buyers = async (tokenAddress: string): Promise<string[]> => {
    const buyers: string[] = [];
    try {
        const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=', 'confirmed');
        const tokenPubKey = new PublicKey(tokenAddress);
        let beforeSignature: string | undefined = undefined;
        const maxRetries = 3;

        while (buyers.length < 30) {
            const confirmedSignatures = await connection.getSignaturesForAddress(tokenPubKey, {
                limit: 20,
                before: beforeSignature,
            });

            if (confirmedSignatures.length === 0) {
                console.warn('⚠️ No more transactions found.');
                break;
            }

            for (const signatureInfo of confirmedSignatures) {
                if (buyers.length >= 30) break;

                let retries = maxRetries;
                while (retries > 0) {
                    try {
                        const transaction = await connection.getTransaction(signatureInfo.signature, {
                            commitment: 'confirmed',
                            maxSupportedTransactionVersion: 0,
                        });

                        if (transaction?.meta?.postTokenBalances) {
                            transaction.meta.postTokenBalances.forEach(balance => {
                                if (
                                    balance.owner &&
                                    Number(balance.uiTokenAmount.amount) > 0 &&
                                    balance.mint === tokenAddress &&
                                    !buyers.includes(balance.owner)
                                ) {
                                    buyers.push(balance.owner);
                                    console.log(`✅ Buyer Found: ${balance.owner}`);
                                }
                            });
                        }
                        break;
                    } catch (error: any) {
                        if (error.message.includes('429')) {
                            console.warn('⚠️ Rate limit hit. Retrying...');
                            await delay(2000);
                        } else {
                            throw error;
                        }
                    }
                    retries--;
                }
            }
            beforeSignature = confirmedSignatures[confirmedSignatures.length - 1]?.signature;
            await delay(2000);
        }

        for (const buyer of buyers) {
            await db.query(
                `INSERT INTO tokens (initial_token_address, buyer_address) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [tokenAddress, buyer]
            );
        }

        console.log('✅ Buyers saved to database.');
        return buyers;
    } catch (error) {
        console.error('❌ Error in getFirst30Buyers:', error);
        return buyers;
    }
};


// import { Connection, PublicKey } from '@solana/web3.js';
// import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import axios from 'axios';

// // Helper function for delay
// function delay(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// // Main function to fetch wallet token details
// async function getWalletTokens(walletAddress: string): Promise<void> {
//     try {
//         // Connect to Solana RPC
//         const connection = new Connection(
//             'https://mainnet.helius-rpc.com/?api-key=b275fdc8-48b7-4a55-84e0-28cfe348e81e',
//             'confirmed'
//         );
//         const walletPubKey = new PublicKey(walletAddress);

//         // Fetch token accounts of the wallet
//         const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubKey, {
//             programId: TOKEN_PROGRAM_ID,
//         });

//         if (tokenAccounts.value.length === 0) {
//             console.warn('⚠️ No tokens found for this wallet.');
//             return;
//         }

//         // Process token accounts
//         const tokenDetails: {
//             tokenAddress: string;
//             amount: number;
//         }[] = [];

//         for (const account of tokenAccounts.value) {
//             const accountData = AccountLayout.decode(account.account.data);
//             const tokenAddress = new PublicKey(accountData.mint).toString();

//             // Fetch token decimals
//             const decimals = 9; // Replace with actual decimals if fetched from token metadata
//             const balance = Number(accountData.amount) / Math.pow(10, decimals);

//             if (!tokenAddress || balance === 0) continue;

//             tokenDetails.push({
//                 tokenAddress,
//                 amount: balance,
//             });

//             console.log(`✅ Processed token: ${tokenAddress} | Balance: ${balance}`);
//             // Delay between token price fetch to avoid rate-limiting
//             await delay(500);
//         }

//         // Display token details in table format
//         console.log('\n📊 **Wallet Token Holdings:**');
//         console.table(
//             tokenDetails.map((token) => ({
//                 'Token Address': token.tokenAddress,
//                 'Token Amount': token.amount,
//             }))
//         );
//     } catch (error) {
//         console.error('❌ Error fetching wallet tokens:', error);
//     }
// }

// // Replace with your Solana wallet address
// const walletAddress = '4g5QxACAPZNxHSAZTzqh4QhANktwW7VNFSyXVxe6xBsR';
// getWalletTokens(walletAddress);


// async function getFirst30Buyers(tokenAddress: string): Promise<void> {
//     try {
//         // Connect to Solana RPC
//         const connection = new Connection(
//             'https://mainnet.helius-rpc.com/?api-key=b275fdc8-48b7-4a55-84e0-28cfe348e81e',
//             'confirmed'
//         );
//         const tokenPubKey = new PublicKey(tokenAddress);

//         const buyers: string[] = []; // Array to maintain order
//         let beforeSignature: string | undefined = undefined; // For pagination
//         const maxRetries = 3; // Max retries per request

//         // Fetch until we have 30 unique addresses
//         while (buyers.length < 30) {
//             console.log(`🔄 Fetching transactions... Current buyers count: ${buyers.length}`);

//             try {
//                 // Fetch transactions in smaller batches
//                 const confirmedSignatures = await connection.getSignaturesForAddress(
//                     tokenPubKey,
//                     {
//                         limit: 20, // Smaller batch to avoid rate limits
//                         before: beforeSignature,
//                     }
//                 );

//                 if (confirmedSignatures.length === 0) {
//                     console.warn('⚠️ No more transactions found.');
//                     break;
//                 }

//                 let newBuyersFound = false;

//                 for (const signatureInfo of confirmedSignatures) {
//                     if (buyers.length >= 30) break;

//                     let retries = maxRetries;
//                     let success = false;

//                     while (retries > 0 && !success) {
//                         try {
//                             const transaction = await connection.getTransaction(signatureInfo.signature, {
//                                 commitment: 'confirmed',
//                                 maxSupportedTransactionVersion: 0,
//                             });

//                             if (transaction && transaction.meta && transaction.meta.postTokenBalances) {
//                                 transaction.meta.postTokenBalances.forEach((balance) => {
//                                     const amount = Number(balance.uiTokenAmount.amount);

//                                     if (
//                                         balance.owner &&
//                                         amount > 0 &&
//                                         balance.mint === tokenAddress &&
//                                         !buyers.includes(balance.owner) // Avoid duplicates
//                                     ) {
//                                         buyers.push(balance.owner);
//                                         newBuyersFound = true;
//                                         console.log(`✅ ${buyers.length} - New Buyer Found: ${balance.owner}`);
//                                     }
//                                 });
//                             }

//                             success = true; // Transaction processed successfully
//                         } catch (error: any) {
//                             if (error.message.includes('429')) {
//                                 console.warn(`⚠️ Rate limit hit on transaction. Retrying in 2s...`);
//                                 await delay(2000); // Fixed 2-second delay on 429
//                             } else {
//                                 console.error('❌ Error fetching transaction details:', error);
//                                 throw error;
//                             }
//                         }
//                         retries--;
//                     }

//                     if (buyers.length >= 30) break;
//                 }

//                 // Pagination: Move to the next batch
//                 beforeSignature = confirmedSignatures[confirmedSignatures.length - 1]?.signature;

//                 if (!newBuyersFound) {
//                     console.warn('⚠️ No new buyers found in this batch.');
//                 }

//                 // Fixed delay between batches to prevent rate limiting
//                 console.log('⏳ Waiting 2 seconds before fetching the next batch...');
//                 await delay(2000);

//                 if (!beforeSignature) {
//                     console.warn('⚠️ No more signatures to paginate.');
//                     break;
//                 }
//             } catch (error: any) {
//                 if (error.message.includes('429')) {
//                     console.warn(`⚠️ Rate limit hit during batch fetch. Retrying in 5s...`);
//                     await delay(5000); // Fixed 5-second delay on batch-level 429
//                 } else {
//                     console.error('❌ Error during batch fetch:', error);
//                     throw error;
//                 }
//             }
//         }

//         console.log('\n✅ **The first 30 buyers are:**');
//         buyers.slice(0, 30).forEach((buyer, index) => {
//             console.log(`${index + 1} - ${buyer}`);
//         });
//     } catch (error) {
//         console.error('❌ Error fetching token buyers:', error);
//     }
// }

// // Replace with your Solana token address
// const tokenAddress = 'KENJSUYLASHUMfHyy5o4Hp2FdNqZg1AsUPhfH2kYvEP';
// getFirst30Buyers(tokenAddress);
