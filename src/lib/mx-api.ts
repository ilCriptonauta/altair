import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";

// Using the mainnet public API
const API_URL = "https://api.multiversx.com";
const GATEWAY_URL = "https://gateway.multiversx.com";

export interface AccountDetails {
    address: string;
    nonce: number;
    balance: string;
    username?: string;
    shard?: number;
    txCount?: number; // active transaction count or similar metric
    developerReward?: string;
    activeStake?: string;
    claimableRewards?: string;
    tokenCount?: number;
    nftCount?: number;
    isGuarded?: boolean;
}

export async function getXSpotlightProfile(address: string): Promise<{ image: string } | null> {
    try {
        const response = await fetch(`https://id-api.multiversx.com/api/v1/users/${address}`);
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
 * Handles Herotag resolution if the input is not a direct address (simple check).
 */
export async function getAccountDetails(identifier: string): Promise<AccountDetails | null> {
    try {
        let address = identifier;
        let accountData: AccountDetails | null = null;

        // basic herotag heuristic
        if (!identifier.startsWith("erd1")) {
            // 1. Try exact username first (API follows redirects to /accounts/{address})
            let res = await fetch(`${API_URL}/usernames/${identifier}`);

            // 2. If 404 and identifier doesn't have a dot, try appending .elrond
            if (!res.ok && res.status === 404 && !identifier.includes(".")) {
                const fallback = identifier + ".elrond";
                res = await fetch(`${API_URL}/usernames/${fallback}`);
            }

            if (res.ok) {
                // API redirects /usernames/{name} -> /accounts/{address}
                // So we get the full account details back directly
                accountData = await res.json() as AccountDetails;
                address = accountData.address;
            } else {
                // If still failing, return null or try generic lookup (which will probably fail if it's not an address)
                console.warn(`Failed to resolve username ${identifier}`);
                return null;
            }
        } else {
            const response = await fetch(`${API_URL}/accounts/${address}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Account not found
                }
                throw new Error(`Failed to fetch account: ${response.statusText}`);
            }

            accountData = await response.json();
        }

        if (accountData) {
            // Fetch Delegation Data to map activeStake
            try {
                // Ensure address is correct
                const delegationRes = await fetch(`${API_URL}/accounts/${address}/delegation`, { cache: 'no-store' });
                if (delegationRes.ok) {
                    const delegationData = await delegationRes.json();
                    let totalStake = 0n;
                    let totalRewards = 0n;
                    if (Array.isArray(delegationData)) {
                        for (const item of delegationData) {
                            if (item.userActiveStake) {
                                totalStake += BigInt(item.userActiveStake);
                            }
                            if (item.claimableRewards) {
                                totalRewards += BigInt(item.claimableRewards);
                            }
                        }
                    }
                    accountData.activeStake = totalStake.toString();
                    accountData.claimableRewards = totalRewards.toString();
                } else {
                    console.warn("Delegation fetch failed:", delegationRes.status);
                }
            } catch (e) {
                console.error("Failed to fetch delegation data", e);
            }

            // Fetch Transaction Count
            try {
                const txCountRes = await fetch(`${API_URL}/accounts/${address}/transactions/count`, { cache: 'no-store' });
                if (txCountRes.ok) {
                    const count = await txCountRes.json();
                    accountData.txCount = Number(count);
                }
            } catch (e) {
                console.error("Failed to fetch tx count", e);
            }

            // Fetch Counts according to Explorer Logic:
            // Tokens = FungibleESDT + MetaESDT
            // NFTs = NonFungibleESDT (excluding MetaESDT which are technically non-fungible on API but shown as tokens on Explorer)

            try {
                // We need 3 separate counts
                const [fungibleRes, metaRes, totalNftsRes] = await Promise.all([
                    fetch(`${API_URL}/accounts/${address}/tokens/count?type=FungibleESDT`, { cache: 'no-store' }),
                    fetch(`${API_URL}/accounts/${address}/nfts/count?type=MetaESDT`, { cache: 'no-store' }),
                    fetch(`${API_URL}/accounts/${address}/nfts/count`, { cache: 'no-store' }) // Total NFTs including SFTs, Meta, etc.
                ]);

                const fungibleCount = fungibleRes.ok ? Number(await fungibleRes.json()) : 0;
                const metaCount = metaRes.ok ? Number(await metaRes.json()) : 0;
                const totalNftsCount = totalNftsRes.ok ? Number(await totalNftsRes.json()) : 0;

                // Tokens = Fungible + Meta (Explorer Logic)
                accountData.tokenCount = fungibleCount + metaCount;

                // NFTs = Total NFTs - Meta (Explorer Logic)
                // Explorer counts SFTs as NFTs, but moves MetaESDTs to Tokens tab.
                accountData.nftCount = Math.max(0, totalNftsCount - metaCount);

            } catch (e) {
                console.error("Failed to fetch token/nft counts", e);
            }
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
    try {
        const response = await fetch(`${API_URL}/accounts/${address}/nfts?size=${size}&from=${from}&type=NonFungibleESDT,SemiFungibleESDT,MetaESDT`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data as NFT[];
    } catch (error) {
        console.error("Error fetching NFTs:", error);
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
        // Fetch trade pairs from xExchange (all pairs, not just core, to include community tokens like OLV, ONX)
        const response = await fetch(`${API_URL}/mex-pairs?size=1000`, { cache: 'no-store' });
        if (!response.ok) return { gainers: [], losers: [] };

        const data = await response.json();

        const movers: MarketMover[] = data
            .filter((pair: any) => {
                // Filter out pairs with low volume or invalid data to avoid noise
                return pair.state === 'active' &&
                    pair.volume24h > 1000 && // Min $1000 daily volume
                    pair.basePrice > 0 &&
                    pair.basePrevious24hPrice > 0;
            })
            .map((pair: any) => {
                // Calculate change based on the BASE token (which is what we are tracking against WEGLD usually)
                const currentPrice = pair.basePrice;
                const prevPrice = pair.basePrevious24hPrice;
                const change = ((currentPrice - prevPrice) / prevPrice) * 100;

                return {
                    identifier: pair.baseId,
                    ticker: pair.baseSymbol,
                    price: currentPrice,
                    change24h: change,
                    volume24h: pair.volume24h,
                    image: `https://tools.multiversx.com/assets-cdn/tokens/${pair.baseId}/icon.png`
                };
            });

        // Remove duplicates (same token might be in multiple pairs)
        const uniqueMovers = Array.from(new Map(movers.map((m: MarketMover) => [m.identifier, m])).values()) as MarketMover[];

        // Sort by change
        const sorted = uniqueMovers.sort((a, b) => b.change24h - a.change24h);

        return {
            gainers: sorted.slice(0, 5),
            losers: sorted.slice(-5).reverse() // Bottom 5, reversed to show worst first
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

