export type QueueUrls = never;
export type AppUrls = never;

export const getBucketName = (_bucket: never): string => {
	throw new Error("No buckets defined in the starter template.");
};

export const getResourceUrl = (_resource: AppUrls | QueueUrls): string => {
	throw new Error("No external resources defined in the starter template.");
};
