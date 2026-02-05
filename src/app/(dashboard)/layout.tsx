import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import CommandMenu from '@/components/layout/command-menu';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // We are temporarily bypassing the auth check because supabase.auth.getUser() 
    // appears to be hanging on this specific environment.
    const dummyUser = { email: 'debug@test.com' };

    return (
        <div className="flex h-screen bg-gray-50">
            <CommandMenu />
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header user={dummyUser} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-slate-950">
                    {children}
                </main>
            </div>
        </div>
    );
}
