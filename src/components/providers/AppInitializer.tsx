"use client";

import { useEffect, useState } from "react";
import { initApp } from "@multiversx/sdk-dapp/out/methods/initApp/initApp";
import { EnvironmentsEnum } from "@multiversx/sdk-dapp/out/types/enums.types";
import { type PropsWithChildren } from "react";

const NETWORK_CONFIG = {
    walletAddress: "https://wallet.multiversx.com",
    apiAddress: "https://api.multiversx.com",
    explorerAddress: "https://explorer.multiversx.com",
};

export function AppInitializer({ children }: PropsWithChildren) {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            await initApp({
                dAppConfig: {
                    environment: EnvironmentsEnum.mainnet,
                    network: NETWORK_CONFIG,
                    // nativeAuth: true, // Optional: enable if native auth needed
                },
                storage: {
                    getStorageCallback: () => window.localStorage,
                }
            });
            setInitialized(true);
        };

        initialize();
    }, []);

    if (!initialized) {
        return null; // Or a loading spinner
    }

    return (
        <>
            {children}
        </>
    );
}
