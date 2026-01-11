import {
	SendMessageBatchCommand,
	SendMessageCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";
import type { QueueUrls } from "/core/src/config/resourceUrls";
import { getResourceUrl } from "/core/src/config/resourceUrls";
import type { DocumentExtractionPushMessageToQueueArgs, EmbeddingsQueuePushMessageToQueueArgs, EvalQueuePushMessageToQueueArgs, GeneralSmallTaskQueuePushMessageToQueueArgs, KnowledgeGraphQueuePushMessageToQueueArgs, OcrQueuePushMessageToQueueArgs } from "./queueMessageTypes";

type PushMessageToSQSArgs = OcrQueuePushMessageToQueueArgs | EmbeddingsQueuePushMessageToQueueArgs | GeneralSmallTaskQueuePushMessageToQueueArgs | KnowledgeGraphQueuePushMessageToQueueArgs | DocumentExtractionPushMessageToQueueArgs | EvalQueuePushMessageToQueueArgs;

const pushMessageToSQS = async ({ queue, message }: PushMessageToSQSArgs) => {
	// log SAVE_LLM_REQUEST pushes
	if (queue === "SmallTaskQueue" && message.task_type === "SAVE_LLM_REQUEST") {
		console.log("✅🚀 Saving LLM request to SQS", JSON.stringify(message, null, 2));
	}

	const sqsClient = new SQSClient({});
	const queueUrl = getResourceUrl(queue);
	const params = {
		QueueUrl: queueUrl,
		MessageBody: JSON.stringify(message),
	};

	const command = new SendMessageCommand(params);
	const response = await sqsClient.send(command);
	return response.MessageId;
};


type PushBatchMessageToSQSArgs = {
	queue: QueueUrls;
	messages: Record<string, unknown>[];
};

const pushBatchMessageToSQS = async ({
	queue,
	messages,
}: PushBatchMessageToSQSArgs) => {
	const sqsClient = new SQSClient({});
	const queueUrl = getResourceUrl(queue);

	// SQS batch send has a limit of 10 messages per request
	const batchSize = 10;
	const results: string[] = [];

	for (let i = 0; i < messages.length; i += batchSize) {
		const batch = messages.slice(i, i + batchSize);
		const params = {
			QueueUrl: queueUrl,
			Entries: batch.map((message, index) => ({
				Id: `msg-${i + index}`, // Unique ID for each message in the batch
				MessageBody: JSON.stringify(message),
			})),
		};

		try {
				const command = new SendMessageBatchCommand(params);
				const response = await sqsClient.send(command);
				const successfulIds = (response.Successful ?? [])
					.map((msg) => msg.MessageId)
					.filter((id): id is string => typeof id === "string");
				results.push(...successfulIds);

			if (response.Failed?.length) {
				console.error("Some messages failed to send:", response.Failed);
				throw new Error(`Failed to send ${response.Failed.length} messages`);
			}
		} catch (error) {
			console.error(
				`Error sending batch messages to SQS: ${JSON.stringify(error)}`,
			);
			throw error;
		}
	}
	return results;
};

export { pushBatchMessageToSQS, pushMessageToSQS };
