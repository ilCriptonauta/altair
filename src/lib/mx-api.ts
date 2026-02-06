import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { isValidAddress } from "./utils";

// Using the mainnet public API
export const API_CONFIG = {
    url: "https://api.multiversx.com",
    gateway: "https://gateway.multiversx.com",
    explorer: "https://explorer.multiversx.com"
};

const API_URL = API_CONFIG.url;

export interface AccountDetails {
    address: string;
    nonce: number;
    balance: string;
    username?: string;
    shard?: number;
    txCount?: number;
    developerReward?: string;
    activeStake?: string;
    claimableRewards?: string;
    tokenCount?: number;
    nftCount?: number;
    isGuarded?: boolean;
}

export async function getXSpotlightProfile(address: string): Promise<{ image: string } | null> {
    try {
        // Use local proxy to bypass CORS
        const response = await fetch(`/api/xspotlight/${address}`);
        if (!response.ok) return null;

        const data = await response.json();
        if (data && data.profile && data.profile.url) {
            return { image: data.profile.url };
        }
        return null;
    } catch (error) {
        console.error("Error fetching xSpotlight profile:", error);
        return null;
    }
}

/**
 * Fetches account details from the MultiversX API.
 * Handles Herotag resolution if the input is not a direct address.
 */
export async function getAccountDetails(identifier: string): Promise<AccountDetails | null> {
    try {
        let address = identifier;
        let accountData: AccountDetails | null = null;

        // Herotag resolution
        if (!isValidAddress(identifier)) {
            // 1. Try exact username first
            let res = await fetch(`${API_URL}/usernames/${identifier}`);

            // 2. Fallback to .elrond if not found
            if (!res.ok && res.status === 404 && !identifier.includes(".")) {
                res = await fetch(`${API_URL}/usernames/${identifier}.elrond`);
            }

            if (res.ok) {
                accountData = await res.json() as AccountDetails;
                address = accountData.address;
            } else {
                console.warn(`Failed to resolve username ${identifier}`);
                return null;
            }
        } else {
            const response = await fetch(`${API_URL}/accounts/${address}`);
            if (!response.ok) return null;
            accountData = await response.json();
        }

        if (accountData && address) {
            // Parallel fetch for extra data to minimize latency
            const [delegationRes, txCountRes, fungibleRes, metaRes, totalNftsRes] = await Promise.allSettled([
                fetch(`${API_URL}/accounts/${address}/delegation`, { cache: 'no-store' }),
                fetch(`${API_URL}/accounts/${address}/transactions/count`, { cache: 'no-store' }),
                fetch(`${API_URL}/accounts/${address}/tokens/count?type=FungibleESDT`, { cache: 'no-store' }),
                fetch(`${API_URL}/accounts/${address}/nfts/count?type=MetaESDT`, { cache: 'no-store' }),
                fetch(`${API_URL}/accounts/${address}/nfts/count`, { cache: 'no-store' })
            ]);

            // Handle Delegation
            if (delegationRes.status === 'fulfilled' && delegationRes.value.ok) {
                const delegationData = await delegationRes.value.json();
                let totalStake = 0n;
                let totalRewards = 0n;
                if (Array.isArray(delegationData)) {
                    for (const item of delegationData) {
                        totalStake += BigInt(item.userActiveStake || 0);
                        totalRewards += BigInt(item.claimableRewards || 0);
                    }
                }
                accountData.activeStake = totalStake.toString();
                accountData.claimableRewards = totalRewards.toString();
            }

            // Handle Tx Count
            if (txCountRes.status === 'fulfilled' && txCountRes.value.ok) {
                accountData.txCount = Number(await txCountRes.value.json());
            }

            // Handle Token/NFT Counts (Explorer Logic)
            const fungibleCount = (fungibleRes.status === 'fulfilled' && fungibleRes.value.ok) ? Number(await fungibleRes.value.json()) : 0;
            const metaCount = (metaRes.status === 'fulfilled' && metaRes.value.ok) ? Number(await metaRes.value.json()) : 0;
            const totalNftsCount = (totalNftsRes.status === 'fulfilled' && totalNftsRes.value.ok) ? Number(await totalNftsRes.value.json()) : 0;

            accountData.tokenCount = fungibleCount + metaCount;
            accountData.nftCount = Math.max(0, totalNftsCount - metaCount);
        }

        return accountData;

    } catch (error) {
        console.error("Error fetching account details:", error);
        return null;
    }
}

/**
 * Fetches details for multiple accounts in a single batch.
 * Useful for resolving Herotags/Usernames for a list of holders.
 */
export async function getAccounts(addresses: string[]): Promise<AccountDetails[]> {
    if (!addresses.length) return [];
    try {
        // API allows comma-separated addresses. Max length of URL might be a constraint, 
        // so we should chunk if too many, but the caller can handle chunking or we do it here.
        // Let's implement chunking here for safety (e.g. 50 at a time).
        const chunks = [];
        const chunkSize = 50;

        for (let i = 0; i < addresses.length; i += chunkSize) {
            chunks.push(addresses.slice(i, i + chunkSize));
        }

        const results: AccountDetails[] = [];

        // Parallelize requests with a limit? Or sequential to be safe. 
        // Sequential is safer for rate limits.
        for (const chunk of chunks) {
            const joined = chunk.join(",");
            const response = await fetch(`${API_URL}/accounts?addresses=${joined}`, { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                results.push(...data);
            }
        }

        return results;
    } catch (error) {
        console.error("Error fetching batch accounts:", error);
        return [];
    }
}

export interface Transaction {
    txHash: string;
    gasLimit: number;
    gasPrice: number;
    gasUsed: number;
    miniBlockHash: string;
    nonce: number;
    receiver: string;
    receiverShard: number;
    round: number;
    sender: string;
    senderShard: number;
    signature: string;
    status: string;
    value: string;
    fee: string;
    timestamp: number;
    data?: string;
    function?: string;
    action?: {
        category: string;
        name: string;
        description: string;
        arguments?: {
            transfers?: {
                type: string;
                name: string;
                ticker: string;
                collection: string;
                identifier: string;
                value: string;
                decimals?: number;
                svgUrl?: string;
            }[];
            receiver?: string;
        };
    };
    operations?: {
        id: string;
        action: string;
        type: string;
        sender: string;
        receiver: string;
        data?: string;
        collection?: string;
        identifier?: string;
        value: string;
    }[];
}

export async function getTransactions(address: string, size: number = 50, from: number = 0): Promise<Transaction[]> {
    try {
        const response = await fetch(`${API_URL}/accounts/${address}/transactions?size=${size}&from=${from}&withScResults=true`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as Transaction[];
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
}

export interface Token {
    identifier: string;
    name: string;
    ticker: string;
    owner: string;
    decimals: number;
    isPaused: boolean;
    assets?: {
        website?: string;
        description?: string;
        status?: string;
        pngUrl?: string;
        svgUrl?: string;
        social?: {
            twitter?: string;
            whitepaper?: string;
            blog?: string;
            telegram?: string;
            discord?: string;
            email?: string;
            coingecko?: string;
            coinmarketcap?: string;
        };
    };
    transactions?: number;
    accounts?: number;
    canUpgrade?: boolean;
    canMint?: boolean;
    canBurn?: boolean;
    canChangeOwner?: boolean;
    canAddSpecialRoles?: boolean;
    canPause?: boolean;
    canFreeze?: boolean;
    canWipe?: boolean;
    price?: number;
    marketCap?: number;
    supply?: string;
    circulatingSupply?: string;
    balance: string; // Balance as string integer (wei)
    valueUsd?: number;
}

export async function getTokens(address: string, size: number = 100): Promise<Token[]> {
    try {
        const response = await fetch(`${API_URL}/accounts/${address}/tokens?size=${size}`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as Token[];
    } catch (error) {
        console.error("Error fetching tokens:", error);
        return [];
    }
}

export interface NFT {
    identifier: string;
    collection: string;
    timestamp: number;
    attributes: string;
    nonce: number;
    type: string;
    name: string;
    creator: string;
    royalties?: number;
    uris: string[];
    url: string;
    media?: {
        url: string;
        originalUrl: string;
        thumbnailUrl: string;
        fileType: string;
        fileSize: number;
    }[];
    isWhitelistedStorage?: boolean;
    tags?: string[];
    metadata?: {
        name?: string;
        description?: string;
        image?: string;
        dna?: string;
        edition?: number;
        date?: number;
        attributes?: {
            trait_type: string;
            value: string;
        }[];
        compiler?: string;
    };
    balance?: string;
    ticker?: string;
    score?: number;
    rank?: number;
    isNsfw?: boolean;
}

export async function getNFTs(address: string, size: number = 100, from: number = 0): Promise<NFT[]> {
    const url = `${API_URL}/accounts/${address}/nfts?size=${size}&from=${from}&type=NonFungibleESDT,SemiFungibleESDT,MetaESDT`;
    try {
        console.log(`Fetching NFTs from: ${url}`);
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            console.error(`Failed response from ${url}: ${response.status} ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        return data as NFT[];
    } catch (error) {
        console.error(`Error fetching NFTs from ${url}:`, error);
        return [];
    }
}

export async function getCollectionNFTs(address: string, collection: string, size: number = 1000): Promise<NFT[]> {
    try {
        const response = await fetch(`${API_URL}/accounts/${address}/nfts?collection=${collection}&size=${size}`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as NFT[];
    } catch (error) {
        console.error(`Error fetching NFTs for collection ${collection}:`, error);
        return [];
    }
}

export async function getCreatedNFTs(address: string, size: number = 100, from: number = 0): Promise<NFT[]> {
    try {
        const response = await fetch(`${API_URL}/nfts?creator=${address}&size=${size}&from=${from}&type=NonFungibleESDT,SemiFungibleESDT,MetaESDT`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as NFT[];
    } catch (error) {
        console.error("Error fetching created NFTs:", error);
        return [];
    }
}

export async function getCreatedNFTsCount(address: string): Promise<number> {
    try {
        const response = await fetch(`${API_URL}/nfts/count?creator=${address}&type=NonFungibleESDT,SemiFungibleESDT,MetaESDT`, { cache: 'no-store' });
        if (!response.ok) return 0;
        const count = await response.json();
        return Number(count);
    } catch (error) {
        console.error("Error fetching created NFTs count:", error);
        return 0;
    }
}

export async function getCollectedNFTsCount(address: string): Promise<number> {
    try {
        const response = await fetch(`${API_URL}/accounts/${address}/nfts/count?type=NonFungibleESDT,SemiFungibleESDT,MetaESDT`, { cache: 'no-store' });
        if (!response.ok) return 0;
        const count = await response.json();
        return Number(count);
    } catch (error) {
        console.error("Error fetching collected NFTs count:", error);
        return 0;
    }
}

export async function getNFT(identifier: string): Promise<NFT | null> {
    try {
        const response = await fetch(`${API_URL}/nfts/${identifier}`, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        return data as NFT;
    } catch (error) {
        console.error(`Error fetching NFT ${identifier}:`, error);
        return null;
    }
}

export interface TokenDetailed extends Token {
    minted?: string;
    burnt?: string;
    initialMinted?: string;
}

export async function getToken(identifier: string): Promise<TokenDetailed | null> {
    try {
        const response = await fetch(`${API_URL}/tokens/${identifier}`, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        return data as TokenDetailed;
    } catch (error) {
        console.error(`Error fetching token ${identifier}:`, error);
        return null;
    }
}

export interface TokenAccount {
    address: string;
    balance: string;
}

export async function getTokenAccounts(identifier: string, size: number = 10000): Promise<TokenAccount[]> {
    try {
        // Fetch up to 'size' holders. API pagination could be needed for massive tokens, 
        // but 10k is a reasonable default limit for a snapshot tool in this context.
        const response = await fetch(`${API_URL}/tokens/${identifier}/accounts?size=${size}`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as TokenAccount[];
    } catch (error) {
        console.error(`Error fetching token accounts for ${identifier}:`, error);
        return [];
    }
}

export interface CollectionDetailed {
    collection: string;
    type: string;
    name: string;
    ticker: string;
    owner: string;
    timestamp: number;
    canFreeze: boolean;
    canWipe: boolean;
    canPause: boolean;
    canTransfer: boolean;
    decimals?: number; // SFTs might have decimals? Usually 0 for NFTs.
    assets?: {
        website?: string;
        description?: string;
        status?: string;
        pngUrl?: string;
        svgUrl?: string;
    };
    roles?: any[];
}

export async function getCollection(identifier: string): Promise<CollectionDetailed | null> {
    try {
        const response = await fetch(`${API_URL}/collections/${identifier}`, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        return data as CollectionDetailed;
    } catch (error) {
        console.error(`Error fetching collection ${identifier}:`, error);
        return null;
    }
}

export interface CollectionAccount {
    address: string;
    balance: string; // Number of NFTs/SFTs held from this collection
}

export async function getCollectionAccounts(identifier: string, size: number = 10000): Promise<CollectionAccount[]> {
    try {
        const response = await fetch(`${API_URL}/collections/${identifier}/accounts?size=${size}`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as CollectionAccount[];
    } catch (error) {
        console.error(`Error fetching collection accounts for ${identifier}:`, error);
        return [];
    }
}

export interface SftAccount {
    address: string;
    balance: string; // Quantity of SFTs
}

export async function getSftAccounts(identifier: string, nonce: number, size: number = 10000): Promise<SftAccount[]> {
    try {
        // Construct standard SFT identifier: TICKER-123456-01 (nonce as hex string with even length)
        // But users might provide the full identifier.
        // Wait, the API for NFT accounts is /nfts/{identifier}/accounts
        // Identifier in API usually is the full token identifier "TICKER-rand-nonce"

        const response = await fetch(`${API_URL}/nfts/${identifier}/accounts?size=${size}`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as SftAccount[];
    } catch (error) {
        console.error(`Error fetching SFT accounts for ${identifier}:`, error);
        return [];
    }
}

export async function getAccountDaysActive(address: string): Promise<number | null> {
    try {
        // Fetch the very first transaction (order=asc, size=1)
        const response = await fetch(`${API_URL}/accounts/${address}/transactions?size=1&order=asc`, { cache: 'no-store' });
        if (!response.ok) return null;

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            const firstTx = data[0];
            const firstDate = new Date(firstTx.timestamp * 1000);
            const now = new Date();

            // Calculate difference in days
            const diffTime = Math.abs(now.getTime() - firstDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }
        return 0; // No transactions
    } catch (error) {
        console.error("Error fetching account days active:", error);
        return null;
    }
}

export interface GuardianData {
    active: boolean;
    guardian?: string;
    pendingGuardian?: string;
    serviceUID?: string;
}

export async function getGuardianData(address: string): Promise<GuardianData | null> {
    try {
        const response = await fetch(`${API_URL}/accounts/${address}`, { cache: 'no-store' });
        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return {
            active: !!data.isGuarded,
            guardian: data.activeGuardianAddress,
            pendingGuardian: undefined
        };
    } catch (error) {
        console.error("Error fetching guardian data:", error);
        return null;
    }
}

export interface NetworkStats {
    shards: number;
    blocks: number;
    accounts: number;
    transactions: number;
    scResults: number;
    epoch: number;
    roundsPassed: number;
    roundsPerEpoch: number;
    refreshRate: number;
}

export async function getNetworkStats(): Promise<NetworkStats | null> {
    try {
        const response = await fetch(`${API_URL}/stats`, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        return data as NetworkStats;
    } catch (error) {
        console.error("Error fetching network stats:", error);
        return null;
    }
}

export async function getValidatorCount(): Promise<number> {
    try {
        const response = await fetch(`${API_URL}/nodes/count`, { cache: 'no-store' });
        if (!response.ok) return 0;
        const count = await response.json();
        return Number(count);
    } catch (error) {
        console.error("Error fetching validator count:", error);
        return 0;
    }
}

export interface EgldPrice {
    usd: number;
    usd_24h_change: number;
}

export async function getEgldPrice(): Promise<EgldPrice | null> {
    try {
        // 1. Fetch Price from MultiversX API (Reliable)
        const response = await fetch(`${API_URL}/economics`, { cache: 'no-store' });
        if (!response.ok) return null;

        const data = await response.json();
        const price = data.price;
        let change = 0;

        // 2. Try to fetch 24h change from CoinGecko (Best Effort)
        try {
            const cgResponse = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2&vs_currencies=usd&include_24hr_change=true", {
                cache: 'no-store',
                signal: AbortSignal.timeout(2000) // Timeout after 2s to not block
            });
            if (cgResponse.ok) {
                const cgData = await cgResponse.json();
                if (cgData["elrond-erd-2"]) {
                    change = cgData["elrond-erd-2"].usd_24h_change;
                }
            }
        } catch (e) {
            // Silently ignore CoinGecko failures (rate limits, etc)
        }

        return {
            usd: price,
            usd_24h_change: change
        };

    } catch (error) {
        console.error("Error fetching EGLD price:", error);
        return null; // Return null only if main API fails (unlikely)
    }
}

export interface Delegation {
    address: string;
    contract: string;
    userUnBondable: string;
    userActiveStake: string;
    claimableRewards: string;
    userUndelegatedList: any[];
}

export async function getDelegations(address: string): Promise<Delegation[]> {
    try {
        const response = await fetch(`${API_URL}/accounts/${address}/delegation`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as Delegation[];
    } catch (error) {
        console.error("Error fetching delegations:", error);
        return [];
    }
}

export interface ProviderDetails {
    provider: string;
    owner: string;
    featured: boolean;
    serviceFee: number;
    delegationCap: string;
    apr: number;
    numUsers: number;
    cumulatedRewards: string;
    identity: string;
    totalUnStaked: string;
}

export async function getProviderDetails(contract: string): Promise<ProviderDetails | null> {
    try {
        const response = await fetch(`${API_URL}/providers/${contract}`, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        return data as ProviderDetails;
    } catch (error) {
        console.error("Error fetching provider details:", error);
        return null;
    }
}

export interface Identity {
    identity: string;
    name: string;
    description: string;
    avatar: string;
    website: string;
    twitter: string;
    location: string;
    score: number;
    rank: number;
    distribution?: Record<string, number>;
    providers?: string[];
}

export async function getIdentity(identity: string): Promise<Identity | null> {
    try {
        const response = await fetch(`${API_URL}/identities/${identity}`, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        return data as Identity;
    } catch (error) {
        console.error("Error fetching identity:", error);
        return null;
    }
}

export interface MarketMover {
    identifier: string;
    ticker: string;
    price: number;
    change24h: number;
    volume24h: number;
    image: string;
}

export async function getMarketMovers(): Promise<{ gainers: MarketMover[], losers: MarketMover[] }> {
    try {
        // Fetch tokens from MEX API (more concise than mex-pairs)
        const response = await fetch(`${API_URL}/mex/tokens?size=1000`, { cache: 'no-store' });
        if (!response.ok) return { gainers: [], losers: [] };

        const data = await response.json();

        const movers: MarketMover[] = data
            .filter((t: any) => {
                // Filter tokens with some volume and price data
                const volume = t.volume24h || t.previous24hVolume || 0;
                return t.price > 0 && t.previous24hPrice > 0 && volume > 5000;
            })
            .map((t: any) => {
                const change = ((t.price - t.previous24hPrice) / t.previous24hPrice) * 100;

                return {
                    identifier: t.id,
                    ticker: t.symbol,
                    price: t.price,
                    change24h: change,
                    volume24h: t.volume24h || t.previous24hVolume || 0,
                    image: `https://tools.multiversx.com/assets-cdn/tokens/${t.id}/icon.png`
                };
            });

        // Separate and Sort
        const allSorted = movers.sort((a, b) => b.change24h - a.change24h);

        // Ensure gainers are positive and losers are negative if possible, or just top/bottom 5
        const gainers = allSorted.slice(0, 5);
        const losers = allSorted.slice(-5).reverse();

        // Safety check: if they overlap (total tokens < 10), filter them out
        const resultGainers = gainers;
        const resultLosers = losers.filter(l => !resultGainers.find(g => g.identifier === l.identifier));

        return {
            gainers: resultGainers,
            losers: resultLosers
        };

    } catch (error) {
        console.error("Error fetching market movers:", error);
        return { gainers: [], losers: [] };
    }
}

export async function getTransaction(hash: string): Promise<Transaction | null> {
    try {
        const response = await fetch(`${API_URL}/transactions/${hash}`, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        return data as Transaction;
    } catch (error) {
        console.error(`Error fetching transaction ${hash}:`, error);
        return null;
    }
}

export async function getCollectionNFTCount(collection: string): Promise<number> {
    try {
        const response = await fetch(`${API_URL}/collections/${collection}/nfts/count`, { cache: 'no-store' });
        if (!response.ok) return 0;
        const count = await response.json();
        return Number(count);
    } catch (error) {
        console.error(`Error fetching NFT count for collection ${collection}:`, error);
        return 0;
    }
}

export async function getGlobalCollectionNFTs(collection: string, from: number = 0, size: number = 1): Promise<NFT[]> {
    try {
        const response = await fetch(`${API_URL}/collections/${collection}/nfts?from=${from}&size=${size}`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as NFT[];
    } catch (error) {
        console.error(`Error fetching NFTs from ${collection}:`, error);
        return [];
    }
}

