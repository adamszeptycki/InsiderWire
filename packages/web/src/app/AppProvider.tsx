'use client';

import type { ReactNode } from "react";

const AppProvider = ({ children }: { children: ReactNode }) => {
	return <>{children}</>;
};

export default AppProvider;
