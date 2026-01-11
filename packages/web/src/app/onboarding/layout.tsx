"use client";
import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
	return <div className="p-6">{children}</div>;
}
