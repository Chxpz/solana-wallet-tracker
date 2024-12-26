import { Connection, PublicKey } from '@solana/web3.js';
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import db from './db'; // Use a conexão compartilhada

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const getWalletTokens = async (buyerAddress: string, initialToken: string) => {
    try {
        const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=', 'confirmed');
        const walletPubKey = new PublicKey(buyerAddress);

        const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubKey, {
            programId: TOKEN_PROGRAM_ID,
        });

        for (const account of tokenAccounts.value) {
            const accountData = AccountLayout.decode(account.account.data);
            const tokenAddress = new PublicKey(accountData.mint).toString();
            const decimals = 9;
            const balance = Number(accountData.amount) / Math.pow(10, decimals);

            if (!tokenAddress || balance === 0) continue;

            console.log(`✅ Token Found: ${tokenAddress} | Balance: ${balance}`);

            await db.query(
                `INSERT INTO wallet_tokens (buyer_address, token_address, token_amount) VALUES ($1, $2, $3)`,
                [buyerAddress, tokenAddress, balance]
            );
        }
    } catch (error) {
        console.error('❌ Error fetching wallet tokens:', error);
    }
};
