import "./globals.css";
import { metadata } from "./metadata";
import AppProvider from "./AppProvider";

export { metadata };

export default function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<body className="font-primary min-h-screen bg-slate-950 text-slate-100">
				<AppProvider>
					<main className="min-h-screen">{children}</main>
				</AppProvider>
			</body>
		</html>
	);
}
