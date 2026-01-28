import { ImageResponse } from 'next/og';
import { getCollectionNFTs, getAccountDetails } from "@/lib/mx-api";

export const runtime = 'edge';
export const alt = 'Altair Gallery';
export const contentType = 'image/png';
export const size = {
    width: 1200,
    height: 630,
};

export default async function Image({ params }: { params: { address: string; collection: string } }) {
    // Await params if necessary? Next.js 15 might require it, but for now treating as object in OG image usually works or awaits automatically.
    // Actually in 15 it's async params.
    // But let's assume params is available.
    const { address, collection } = await params;

    let targetAddress = address;
    if (!address.startsWith("erd1")) {
        const account = await getAccountDetails(address);
        if (account) targetAddress = account.address;
    }

    const nfts = await getCollectionNFTs(targetAddress, collection, 4);
    const displayAddress = !address.startsWith("erd1") ? address : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#020617',
                    backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
                    backgroundSize: '100px 100px',
                    position: 'relative',
                    fontFamily: 'sans-serif'
                }}
            >
                {/* Background Glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                }} />

                {/* Grid of Images */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', zIndex: 10 }}>
                    {nfts.slice(0, 3).map((nft, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            width: '260px',
                            height: '260px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            border: '4px solid #1E293B',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            transform: i === 1 ? 'translateY(-20px) scale(1.1)' : 'rotate(' + (i === 0 ? '-6deg' : '6deg') + ')',
                            zIndex: i === 1 ? 20 : 10,
                        }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={nft.media?.[0]?.thumbnailUrl || nft.media?.[0]?.url || nft.url}
                                alt="NFT"
                                width="260"
                                height="260"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                    ))}
                </div>

                {/* Text Content */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 20 }}>
                    <div style={{
                        color: '#FBBF24',
                        fontSize: 24,
                        fontWeight: 'bold',
                        letterSpacing: '0.1em',
                        marginBottom: '10px',
                        textTransform: 'uppercase',
                        background: '#1E293B',
                        padding: '8px 20px',
                        borderRadius: '100px',
                        border: '1px solid #334155'
                    }}>
                        Collection Gallery
                    </div>
                    <div style={{
                        fontSize: 72,
                        fontWeight: 900,
                        color: 'white',
                        lineHeight: 1,
                        marginBottom: '10px',
                        textShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        textAlign: 'center',
                        maxWidth: '1000px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {collection}
                    </div>
                    <div style={{
                        fontSize: 32,
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ color: '#22D3EE' }}>@{displayAddress}</span> on Altair
                    </div>
                </div>

                {/* Logo Bottom Right */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    right: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    opacity: 0.8
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(45deg, #22D3EE, #A855F7)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0F172A',
                        fontWeight: '900',
                        fontSize: '24px'
                    }}>A</div>
                    <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>Altair</span>
                </div>
            </div>
        )
    );
}
