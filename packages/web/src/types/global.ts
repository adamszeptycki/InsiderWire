import type { IPrimaryColor, IThemeMode } from "@/types/theme";

export type IThemeState = {
	mode: IThemeMode;
	primary: IPrimaryColor;
};

export type IGlobalState = {
	theme: IThemeState;
};
