import { getDb } from "/core/src/sql";
import { documents } from "/core/src/sql/schema/document/document";
import { documentChunks } from "/core/src/sql/schema/document/documentChunk";
import type { DocumentStatus, DocumentType } from "/core/src/sql/schema/enums";
import { Factory } from "fishery";

type DocumentFactoryFields = typeof documents.$inferInsert;
type DocumentChunkFactoryFields = typeof documentChunks.$inferInsert;

const documentFactory = Factory.define<DocumentFactoryFields>(({ params, sequence }) => ({
    title: params.title || `Test Document ${sequence}`,
    md5: params.md5 || `test-md5-${sequence}`,
    content: params.content || `Test document content ${sequence}`,
    url: params.url || `https://example.com/document-${sequence}`,
    s3Key: params.s3Key || `document-${sequence}.pdf`,
    s3Bucket: params.s3Bucket || 'test-bucket',
    status: (params.status || "new") as DocumentStatus,
    type: (params.type || "knowledge_document") as DocumentType,
    organizationId: params.organizationId as string,
    ownerId: params.ownerId as string,
    vertical: params.vertical as string || null,
    documentType: params.documentType as string || null,
    description: params.description as string || null,
    tags: params.tags as string[] || [],
    exampleQuestions: params.exampleQuestions as string[] || [],
    metaData: params.metaData as Record<string, any> || {},
    startEmbeddings: params.startEmbeddings || false,
}));

const documentChunkFactory = Factory.define<DocumentChunkFactoryFields>(({ params, sequence }) => ({
    documentId: params.documentId as string,
    name: params.name || `Chunk ${sequence}`,
    chunk: params.chunk || `Test chunk content ${sequence}`,
    md5: params.md5 || `chunk-md5-${sequence}`,
    humanAnnotation: params.humanAnnotation as string || null,
    tokens: params.tokens || 100,
    model: params.model || 'text-embedding-ada-002',
    collectionName: params.collectionName as string || null,
    type: params.type || 'text',
    describesChunkId: params.describesChunkId as string || null,
    metadata: params.metadata as Record<string, any> || {},
}));

async function createTestDocument(
    organizationId: string,
    ownerId: string,
    overrides?: Partial<DocumentFactoryFields>
) {
    const db = getDb();
    const documentData = documentFactory.build({
        ...overrides,
        organizationId,
        ownerId
    });

    const [newDocument] = await db.insert(documents).values(documentData).returning();
    return newDocument;
}

async function createTestDocumentChunk(
    documentId: string,
    overrides?: Partial<DocumentChunkFactoryFields>
) {
    const db = getDb();
    const chunkData = documentChunkFactory.build({
        ...overrides,
        documentId
    });

    const [newChunk] = await db.insert(documentChunks).values(chunkData).returning();
    return newChunk;
}

/**
 * Creates a test document with the specified number of chunks
 * @param organizationId - The ID of the organization the document belongs to
 * @param ownerId - The ID of the user who owns the document
 * @param chunkCount - Number of chunks to create (default: 3)
 * @param overrides - Optional overrides for the document
 * @returns Object containing the created document and chunks array
 */
async function createTestDocumentWithChunks(
    organizationId: string,
    ownerId: string,
    chunkCount: number = 3,
    overrides?: Partial<DocumentFactoryFields>
) {
    const document = await createTestDocument(organizationId, ownerId, overrides);

    const chunks: Array<Awaited<ReturnType<typeof createTestDocumentChunk>>> = [];
    for (let i = 0; i < chunkCount; i++) {
        const chunk = await createTestDocumentChunk(document.id, {
            name: `Test Chunk ${i + 1}`,
            chunk: `This is test chunk content ${i + 1} for document ${document.title}`,
            md5: `chunk-md5-${document.id}-${i}`,
        });
        chunks.push(chunk);
    }

    return { document, chunks };
}

export {
    documentFactory,
    documentChunkFactory,
    createTestDocument,
    createTestDocumentChunk,
    createTestDocumentWithChunks
};
