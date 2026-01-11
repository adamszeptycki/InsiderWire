import { getDb } from "/core/src/sql";
import { chatMessageParts } from "/core/src/sql/schema/chat/chatMessageParts";
import { chatMessages } from "/core/src/sql/schema/chat/chatMessages";
import { chats } from "/core/src/sql/schema/chat/chats";
import { type UserMessageFeedbackInsert, userMessageFeedback } from "/core/src/sql/schema/chat/userMessageFeedback";
import type { ChatMessageType, FeedbackDataType, FeedbackType } from "/core/src/sql/schema/enums";
import { Factory } from "fishery";
import { createTestPromptWithVersion } from "./prompt";


type ChatFactoryFields = typeof chats.$inferInsert;
type ChatMessageFactoryFields = typeof chatMessages.$inferInsert;
type ChatMessagePartFactoryFields = typeof chatMessageParts.$inferInsert;
type UserMessageFeedbackFactoryFields = typeof userMessageFeedback.$inferInsert;

const chatFactory = Factory.define<ChatFactoryFields>(({ params }) => ({
    name: params.name || "Test Chat",
    ownerId: params.ownerId as string,
    organizationId: params.organizationId as string,
}));

const chatMessageFactory = Factory.define<ChatMessageFactoryFields>(({ params }) => ({
    userId: params.userId as string | undefined,
    chatId: params.chatId as string | undefined,
    externalId: params.externalId as string | undefined,
}));

const chatMessagePartFactory = Factory.define<ChatMessagePartFactoryFields>(({ params, sequence }) => ({
    chatMessageId: params.chatMessageId as string,
    type: (params.type || "text") as ChatMessageType,
    content: params.content || `Test message content ${sequence}`,
    input: params.input || {},
    output: params.output || {},
}));

const userMessageFeedbackFactory = Factory.define<UserMessageFeedbackFactoryFields>(({ params, sequence }) => ({
    ownerId: params.ownerId as string,
    organizationId: params.organizationId as string,
    feedbackDataType: (params.feedbackDataType || "betterAnswer") as FeedbackDataType,
    feedbackType: (params.feedbackType || "humanProvided") as FeedbackType,
    questionMessageId: params.questionMessageId as string,
    answerMessageId: params.answerMessageId as string,
    suggestionText: params.suggestionText || `Test feedback suggestion ${sequence}`,
    websiteUrl: params.websiteUrl || null,
}));



async function createTestChat(owner: { ownerId: string, organizationId: string }, overrides?: Partial<ChatFactoryFields>) {
    const db = getDb();
    const chatData = chatFactory.build({ ...overrides, ownerId: owner.ownerId, organizationId: owner.organizationId });

    const [newChat] = await db.insert(chats).values(chatData).returning();
    return newChat;
}

// Additional helper functions for creating messages and parts
async function createTestMessage(chatId: string, userId?: string, overrides?: Partial<ChatMessageFactoryFields>) {
    const db = getDb();
    const messageData = chatMessageFactory.build({ ...overrides, chatId, userId });

    const [newMessage] = await db.insert(chatMessages).values(messageData).returning();
    return newMessage;
}

async function createTestMessagePart(
    chatMessageId: string,
    content: string,
    type: ChatMessageType = "text",
    overrides?: Partial<ChatMessagePartFactoryFields>
) {
    const db = getDb();
    const partData = chatMessagePartFactory.build({
        ...overrides,
        chatMessageId,
        content,
        type
    });

    const [newPart] = await db.insert(chatMessageParts).values(partData).returning();
    return newPart;
}

type CreateTestMessageWithPartsBaseArgs = {
    chatId: string;
    userId: string;
    role: "user" | "assistant";
}
type ToolMessageArgs = CreateTestMessageWithPartsBaseArgs & {
    input: Record<string, unknown>;
    output: Record<string, unknown> | Array<Record<string, unknown>>;
    type: "tool" | "step-start" | "tool-searchCandidates" | "tool-countCandidates" | "tool-topSkills" | "tool-searchKnowledgeBase";
}
type TextMessageArgs = CreateTestMessageWithPartsBaseArgs & {
    content: string;
    type: "text" | "reasoning";
}
type CreateTestMessageWithPartsArgs = (TextMessageArgs | ToolMessageArgs)



function isToolMessage(args: CreateTestMessageWithPartsArgs): args is ToolMessageArgs {
    return ["tool", "step-start", "tool-searchCandidates", "tool-countCandidates", "tool-topSkills", "tool-searchKnowledgeBase"].includes(args.type)

}
function isTextMessage(args: CreateTestMessageWithPartsArgs): args is TextMessageArgs {
    return ["text", "reasoning"].includes(args.type)
}

async function createTestMessageWithParts(args: CreateTestMessageWithPartsArgs) {
    const { chatId, userId } = args
    const message = await createTestMessage(chatId, args.role === 'user' ? userId : undefined);
    if (isTextMessage(args)) {
        const content = args.content;
        await createTestMessagePart(message.id, content, args.type);
    } else if (isToolMessage(args)) {
        const input = args.input;
        const output = args.output;
        const type = args.type;
        await createTestMessagePart(message.id, "", type, { input, output });
    } else {
        throw new Error(`Invalid message type for args: ${args}`);
    }
    return {
        message
    }
}

async function createTestFeedback({ questionMessageId, ownerId, organizationId, answerMessageId }: Pick<UserMessageFeedbackInsert, "answerMessageId" | "questionMessageId" | "ownerId" | "organizationId" | "questionMessageId">) {
    const db = getDb();
    const { userMessageFeedback } = await import("/core/src/sql/schema");
    const [feedback] = await db.insert(userMessageFeedback).values({
        ownerId,
        organizationId,
        questionMessageId,
        answerMessageId,
        feedbackDataType: "betterAnswer",
        feedbackType: "humanProvided",
        suggestionText: "Test feedback",
        answerRating: 5,
    }).returning();
    return feedback;
}

/**
 * Creates test user message feedback
 * @param questionMessageId - The ID of the question message
 * @param answerMessageId - The ID of the answer message
 * @param ownerId - The ID of the user creating the feedback
 * @param overrides - Additional overrides for the feedback
 * @returns The created feedback record
 */
type CreateTestUserMessageFeedbackArgs = {
    questionMessageId: string,
    answerMessageId: string,
    ownerId: string,
    organizationId: string,
    overrides?: Partial<UserMessageFeedbackFactoryFields>
}
async function createTestUserMessageFeedback(args: CreateTestUserMessageFeedbackArgs) {
    const { questionMessageId, answerMessageId, ownerId, organizationId, overrides } = args;
    const db = getDb();
    const feedbackData = userMessageFeedbackFactory.build({
        questionMessageId,
        organizationId,
        answerMessageId,
        ownerId,
        ...overrides,
    });

    const [feedback] = await db.insert(userMessageFeedback).values(feedbackData).returning();
    return feedback;
}

/**
 * Creates a complete test setup with chat, messages, and feedback
 * @param userId - The ID of the user who owns the chat
 * @param organizationId - The ID of the organization the chat belongs to
 * @param messageCount - Number of message pairs to create (default: 1, creates 2 messages per pair)
 * @param feedbackOverrides - Additional overrides for the feedback
 * @returns Object containing the created chat, messages array, and feedback array
 */
type CreateTestChatWithFeedbackArgs = {
    userId: string;
    organizationId: string;
    messageCount?: number;
    feedbackOverrides?: Partial<UserMessageFeedbackFactoryFields>;
    started?: boolean;
}

async function createTestChatWithFeedback(args: CreateTestChatWithFeedbackArgs) {
    const { userId, organizationId, messageCount = 1, feedbackOverrides, started = true } = args;

    // Create chat with user and assistant message pairs
    const messagesNeeded = messageCount * 2; // Each pair has user question + assistant answer
    const { chat, messages } = await createTestChatWithMessages({
        userId,
        organizationId,
        messageCount: messagesNeeded,
        started
    });

    // Create feedback for each question/answer pair
    const feedbacks: Array<Awaited<ReturnType<typeof createTestUserMessageFeedback>>> = [];
    for (let i = 0; i < messageCount; i++) {
        const questionMessage = messages[i * 2]; // User messages at even indices
        const answerMessage = messages[i * 2 + 1]; // Assistant messages at odd indices

        if (questionMessage && answerMessage) {
            const feedback = await createTestUserMessageFeedback(
                {
                    questionMessageId: questionMessage.message.id,
                    answerMessageId: answerMessage.message.id,
                    ownerId: userId,
                    organizationId,
                    overrides: feedbackOverrides
                }
            );
            feedbacks.push(feedback);
        }
    }

    return { chat, messages, feedbacks };
}

/**
 * Creates a test chat with the specified number of messages
 * @param userId - The ID of the user who owns the chat
 * @param organizationId - The ID of the organization the chat belongs to
 * @param messageCount - Number of messages to create (default: 2)
 * @returns Object containing the created chat and messages array
 */
type createTestChatWithMessagesArgs = {
    userId: string, organizationId: string, messageCount?: number, started?: boolean
}
async function createTestChatWithMessages(args: createTestChatWithMessagesArgs) {
    const { version: promptVersion } = await createTestPromptWithVersion();
    const { userId, organizationId, messageCount = 2, started = true } = args;
    const chat = await createTestChat({ ownerId: userId, organizationId }, { started, promptVersionId: promptVersion.id });

    const messages: Array<Awaited<ReturnType<typeof createTestMessageWithParts>>> = [];
    for (let i = 0; i < messageCount; i++) {
        const message = await createTestMessageWithParts({
            chatId: chat.id,
            userId,
            content: `Test message ${i + 1}`,
            type: "text",
            role: i % 2 === 0 ? "user" : "assistant"
        });
        messages.push(message);
    }

    return { chat, messages };
}


/**
 * Creates a test generated eval by creating a userMessageFeedback record with eval-specific data
 * @param organizationId - The organization ID
 * @param overrides - Additional overrides for the eval
 * @returns The created eval record (userMessageFeedback)
 */
async function createTestGeneratedEval(
    organizationId: string,
    overrides?: { question?: string; answer?: string;[key: string]: unknown }
) {
    const db = getDb();


    const [evalRecord] = await db.insert(userMessageFeedback).values({
        organizationId,
        ownerId: null,
        feedbackDataType: "documentPart" as FeedbackDataType,
        feedbackType: "humanProvided" as FeedbackType,
        question: overrides?.question || "What is the main topic of this document?",
        answer: overrides?.answer || "The document discusses testing strategies and best practices.",
        questionMessageId: null,
        answerMessageId: null,
        suggestionText: null,
        websiteUrl: null,
        generatedFromDocumentId: null,
        generatedFromDocumentChunkId: null,
        answerRating: null,
        assignedToId: null,
        priority: "medium" as const,
        status: "pending" as const,
        ...overrides,
    }).returning();
    return evalRecord;
}

/**
 * Creates a test generated eval with document references
 * @param organizationId - The organization ID
 * @param documentId - The document ID to reference
 * @param documentChunkId - Optional document chunk ID to reference (currently stored in suggestionText for compatibility)
 * @param overrides - Additional overrides for the eval
 * @returns The created eval record
 */
async function createTestGeneratedEvalWithDocumentReferences(
    organizationId: string,
    documentId: string,
    documentChunkId?: string,
    overrides?: { question?: string; answer?: string;[key: string]: unknown }
) {
    return createTestGeneratedEval(organizationId, {
        generatedFromDocumentId: documentId,
        generatedFromDocumentChunkId: documentChunkId,
        ...(documentChunkId && { suggestionText: `documentChunkId:${documentChunkId}` }),
        question: overrides?.question || `What does document ${documentId} discuss?`,
        answer: overrides?.answer || `The document with ID ${documentId} contains important information.`,
        ...overrides,
    });
}

/**
 * Creates multiple test generated evals for a specific document
 * @param organizationId - The organization ID
 * @param documentId - The document ID to reference
 * @param count - Number of evals to create
 * @returns Array of created eval records
 */
async function createTestGeneratedEvalsForDocument(
    organizationId: string,
    documentId: string,
    count: number
) {
    const evalRecords: Array<Awaited<ReturnType<typeof createTestGeneratedEvalWithDocumentReferences>>> = [];
    for (let i = 0; i < count; i++) {
        const evalRecord = await createTestGeneratedEvalWithDocumentReferences(
            organizationId,
            documentId,
            undefined,
            {
                question: `Question ${i + 1} about document ${documentId}?`,
                answer: `Answer ${i + 1} about the document content.`,
            }
        );
        evalRecords.push(evalRecord);
    }
    return evalRecords;
}

export {
    chatFactory,
    chatMessageFactory,
    chatMessagePartFactory, createTestChat, createTestChatWithFeedback,
    createTestChatWithMessages, createTestFeedback, createTestMessage, createTestMessagePart,
    createTestMessageWithParts,
    createTestUserMessageFeedback, userMessageFeedbackFactory,
    createTestGeneratedEval,
    createTestGeneratedEvalWithDocumentReferences,
    createTestGeneratedEvalsForDocument
};

