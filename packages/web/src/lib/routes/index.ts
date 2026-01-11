type RouteLayout = "fullScreen" | "sidebar";
type RouteInfo = {
	layout: RouteLayout;
	path: string;
	requiresAuth: boolean;
};
type Routes = Record<string, RouteInfo>;

export const routes: Routes = {
	homePage: {
		path: "/authenticate",
		layout: "fullScreen",
		requiresAuth: false,
	},
	// landing: "/landing",
	// home: "/dashboards/ecommerce",
	// docs: "/docs/introduction",
	// auth: {
	// 	login: "/auth/login",
	// 	register: "/auth/register",
	// 	forgotPassword: "/auth/forgot-password",
	// 	resetPassword: "/auth/reset-password",
	// },
	// dashboards: {
	// 	ecommerce: "/dashboards/ecommerce",
	// },
	// apps: {
	// 	ecommerce: {
	// 		orders: {
	// 			index: "/apps/ecommerce/orders",
	// 			show: (id: number | string) => `/apps/ecommerce/orders/${id}`,
	// 		},
	// 		products: {
	// 			index: "/apps/ecommerce/products",
	// 			create: "/apps/ecommerce/products/create",
	// 			edit: (id: number) => `/apps/ecommerce/products/${id}`,
	// 		},
	// 		customers: {
	// 			index: "/apps/ecommerce/customers",
	// 			create: "/apps/ecommerce/customers/create",
	// 			edit: (id: number) => `/apps/ecommerce/customers/${id}`,
	// 		},
	// 		sellers: {
	// 			index: "/apps/ecommerce/sellers",
	// 			create: "/apps/ecommerce/sellers/create",
	// 			edit: (id: number) => `/apps/ecommerce/sellers/${id}`,
	// 		},
	// 		shops: {
	// 			index: "/apps/ecommerce/shops",
	// 			create: "/apps/ecommerce/shops/create",
	// 			edit: (id: number) => `/apps/ecommerce/shops/${id}`,
	// 		},
	// 	},
	// 	fileManager: {
	// 		home: "/apps/file-manager",
	// 	},
	// 	chat: {
	// 		home: "/apps/chat",
	// 	},
	// },
	// ui: {
	// 	components: {
	// 		accordion: "/ui/components/accordion",
	// 		alert: "/ui/components/alert",
	// 		avatar: "/ui/components/avatar",
	// 		badge: "/ui/components/badge",
	// 		breadcrumb: "/ui/components/breadcrumb",
	// 		button: "/ui/components/button",
	// 		countdown: "/ui/components/countdown",
	// 		drawer: "/ui/components/drawer",
	// 		dropdown: "/ui/components/dropdown",
	// 		loading: "/ui/components/loading",
	// 		menu: "/ui/components/menu",
	// 		modal: "/ui/components/modal",
	// 		pagination: "/ui/components/pagination",
	// 		progress: "/ui/components/progress",
	// 		step: "/ui/components/step",
	// 		tab: "/ui/components/tab",
	// 		timeline: "/ui/components/timeline",
	// 		toast: "/ui/components/toast",
	// 		tooltip: "/ui/components/tooltip",
	// 	},
	// 	forms: {
	// 		checkbox: "/ui/forms/checkbox",
	// 		file: "/ui/forms/file",
	// 		input: "/ui/forms/input",
	// 		radio: "/ui/forms/radio",
	// 		range: "/ui/forms/range",
	// 		rating: "/ui/forms/rating",
	// 		toggle: "/ui/forms/toggle",
	// 	},
	// 	charts: {
	// 		apex: {
	// 			area: "/ui/charts/apex/area",
	// 			bar: "/ui/charts/apex/bar",
	// 			pie: "/ui/charts/apex/pie",
	// 			line: "/ui/charts/apex/line",
	// 			column: "/ui/charts/apex/column",
	// 		},
	// 	},
	// },
	// pages: {},
};
