import { getEmailFrom } from "@starter/core/src/config/emailFrom";

export const sendVerificationEmail = async ({
	email,
	verificationUrl,
}: {
	email: string;
	verificationUrl: string;
}) => {
	console.info("sendVerificationEmail stub", { email, verificationUrl, from: getEmailFrom({ useCase: "default" }) });
};

export const sendResetPasswordEmail = async ({
	email,
	verificationUrl,
}: {
	email: string;
	verificationUrl: string;
}) => {
	console.info("sendResetPasswordEmail stub", { email, verificationUrl, from: getEmailFrom({ useCase: "default" }) });
};

export const sendChangeEmailVerification = async ({
	email,
	verificationUrl,
}: {
	email: string;
	verificationUrl: string;
}) => {
	console.info("sendChangeEmailVerification stub", { email, verificationUrl, from: getEmailFrom({ useCase: "default" }) });
};

export const sendOrganizationInvitation = async ({
	recipientEmail,
	organizationName,
	inviterName,
	inviterEmail,
	role,
	invitationId,
	baseUrl,
}: {
	recipientEmail: string;
	organizationName: string;
	inviterName?: string;
	inviterEmail: string;
	role: string;
	invitationId: string;
	baseUrl: string;
}) => {
	const acceptInvitationUrl = `${baseUrl}/auth/sign-up?invitationId=${invitationId}&email=${recipientEmail}`;
	console.info("sendOrganizationInvitation stub", {
		recipientEmail,
		organizationName,
		inviterName,
		inviterEmail,
		role,
		acceptInvitationUrl,
		from: getEmailFrom({ useCase: "invitation" }),
	});
};
