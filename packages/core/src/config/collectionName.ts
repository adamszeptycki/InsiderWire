// For multi-tenant collections, you can use a naming convention like:
// - `embeddings_${tenantId}` for tenant-specific collections
// export const getTenantCollectionName = (tenantId: string) => {
//   return `embeddings_${tenantId}`;
// };

export const getTenantCollectionNameForDocumentChunks = (tenantId: string) => {
  return `document_chunks_${tenantId}`;
};

export const getTenantCollectionNameForHumanAnnotations = (tenantId: string) => {
  return `human_annotations_${tenantId}`;
};