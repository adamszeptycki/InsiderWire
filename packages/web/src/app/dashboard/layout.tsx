"use client";

import type { ReactNode } from "react";

type DashboardLayoutProps = {
	children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	return <div className="p-6">{children}</div>;
}
