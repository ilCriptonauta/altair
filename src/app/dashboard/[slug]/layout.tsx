import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { use } from "react";

export default function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);

    return (
        <div className="min-h-screen bg-[#0F172A] text-white">
            <Sidebar slug={slug} />
            <MobileNav slug={slug} />

            <div
                className="sm:pb-0 sm:pl-20"
                style={{
                    paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))'
                }}
            >
                <main className="mx-auto max-w-7xl p-4 sm:p-8 md:p-12">
                    {children}
                </main>
            </div>
        </div>
    );
}

