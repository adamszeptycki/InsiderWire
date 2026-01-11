import TrpcProvider from "@starter/core-web/src/trpc/Provider";

export const getTrpcUrl = () => {
	const base = (() => {		
		if (process.env.APP_URL) return process.env.APP_URL;
		if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
		if (typeof window !== "undefined") return window.location.origin;
		return `http://localhost:${process.env.PORT ?? 3000}`;
	})();
	const trpcUrl = `${base}/api/trpc`;
	return trpcUrl;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <TrpcProvider trpcUrl={getTrpcUrl()}>
            {children}
        </TrpcProvider>
    )
}

function WithTrpcProvider<P extends object>(WrappedComponent: React.ComponentType<P>) {
    const ComponentWithProvider = (props: P) => (
        <TrpcProvider trpcUrl={getTrpcUrl()}>
            <WrappedComponent {...props} />
        </TrpcProvider>
    );
    ComponentWithProvider.displayName = `WithTrpcProvider(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
    return ComponentWithProvider;
}
export { WithTrpcProvider, Layout};