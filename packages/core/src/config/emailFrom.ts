type EmailFromProps = {
	useCase: "invitation" | "support" | "default";
};

const getEmailFrom = ({ useCase }: EmailFromProps) => {
	const defaultEmail = "no-reply@example.com";
	switch (useCase) {
		case "invitation":
			return "invite@example.com";
		case "support":
			return "support@example.com";
		default:
			return defaultEmail;
	}
};

export { getEmailFrom };