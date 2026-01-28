import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatBalance(balance: string, decimals: number = 18, precision: number = 4): string {
    if (!balance) return "0";
    const value = BigInt(balance);
    const divisor = BigInt(10 ** decimals);

    const integerPart = value / divisor;
    const fractionalPart = value % divisor;

    // Pad fraction with leading zeros to match length of decimals
    let fractionStr = fractionalPart.toString().padStart(decimals, '0');

    // Truncate to precision
    fractionStr = fractionStr.substring(0, precision);

    // Remove trailing zeros if we have a decimal point
    if (precision > 0) {
        // e.g. "5000" -> "5", "0000" -> ""
        // Actually simpler: convert back to number logic? No, BigInt safe.
        // Let's just return formatted string.
        return `${integerPart}.${fractionStr}`;
    }

    return integerPart.toString();
}

export function formatAddress(address: string, start: number = 6, end: number = 6): string {
    if (!address) return "";
    return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}

