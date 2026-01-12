/**
 * Slack client for posting messages via webhook
 */

export interface SlackMessage {
	text: string; // Fallback text for notifications
	blocks?: Array<Record<string, any>>; // Slack Block Kit blocks
	thread_ts?: string; // Thread timestamp for replies
}

export interface SlackMessageResponse {
	ok: boolean;
	ts?: string; // Message timestamp
	error?: string;
}

export class SlackClient {
	private webhookUrl: string;

	constructor(webhookUrl?: string) {
		this.webhookUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL || "";
	}

	/**
	 * Post a message to Slack
	 * @param message Slack message payload
	 * @returns Response with message timestamp
	 */
	async postMessage(message: SlackMessage): Promise<SlackMessageResponse> {
		if (!this.webhookUrl) {
			throw new Error("SLACK_WEBHOOK_URL not configured");
		}

		try {
			const response = await fetch(this.webhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					ok: false,
					error: `Slack API error: ${response.status} ${errorText}`,
				};
			}

			// Webhook URL responses are simple "ok" for success
			// Real Slack API would return the message timestamp
			return {
				ok: true,
				ts: new Date().toISOString(), // Fallback timestamp
			};
		} catch (error) {
			return {
				ok: false,
				error: error instanceof Error ? error.message : "Unknown error posting to Slack",
			};
		}
	}

	/**
	 * Post a threaded reply to an existing message
	 * @param message Message payload
	 * @param threadTs Thread timestamp to reply to
	 * @returns Response with message timestamp
	 */
	async postThreadedReply(
		message: Omit<SlackMessage, "thread_ts">,
		threadTs: string,
	): Promise<SlackMessageResponse> {
		return this.postMessage({
			...message,
			thread_ts: threadTs,
		});
	}
}

/**
 * Create a singleton Slack client instance
 */
export function createSlackClient(webhookUrl?: string): SlackClient {
	return new SlackClient(webhookUrl);
}
