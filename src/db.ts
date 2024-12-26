import { Client } from 'pg';

const db = new Client({
    connectionString: process.env.DATABASE_URL || '',
});

export const connectToDatabase = async () => {
    try {
        await db.connect();
        console.log('✅ Connected to PostgreSQL');
    } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL:', error);
        process.exit(1);
    }
};

export const disconnectFromDatabase = async () => {
    try {
        await db.end();
        console.log('✅ Disconnected from PostgreSQL');
    } catch (error) {
        console.error('❌ Failed to disconnect from PostgreSQL:', error);
    }
};

export default db;
