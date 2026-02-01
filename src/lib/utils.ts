import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";


import { Address } from "@multiversx/sdk-core/out/core/address";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isValidAddress(address: string): boolean {
    try {
        if (!address || !address.startsWith("erd1") || address.length !== 62) {
            return false;
        }
        Address.newFromBech32(address);
        return true;
    } catch (e) {
        return false;
    }
}

export function formatBalance(balance: string | number | bigint, decimals: number = 18, precision: number = 4): string {
    if (!balance || balance === "0") return "0";

    const balanceBigInt = BigInt(balance);
    if (balanceBigInt === 0n) return "0";

    const divisor = BigInt(10 ** decimals);
    const integerPart = balanceBigInt / divisor;
    const fractionalPart = balanceBigInt % divisor;

    if (fractionalPart === 0n) {
        return integerPart.toString();
    }

    let fractionStr = fractionalPart.toString().padStart(decimals, '0');

    // Remove trailing zeros first
    fractionStr = fractionStr.replace(/0+$/, '');

    // Truncate to precision if necessary
    if (fractionStr.length > precision) {
        fractionStr = fractionStr.substring(0, precision);
    }

    if (fractionStr.length === 0) {
        return integerPart.toString();
    }

    return `${integerPart}.${fractionStr}`;
}

export function formatAddress(address: string, start: number = 6, end: number = 6): string {
    if (!address) return "";
    if (address.length <= start + end) return address;
    return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}

