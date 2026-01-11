import { getDb } from "/core/src/sql";
import type {
	InsertCallScenario,
	InsertCallScenarioVersion
} from "/core/src/sql/schema";
import {
	callScenarios,
	callScenarioVersions,
} from "/core/src/sql/schema";
import type { CallScript } from "/types/src/callScript";
import { Factory } from "fishery";
import { v4 as uuidv4 } from "uuid";

type CallScenarioFactoryFields = InsertCallScenario;
type CallScenarioVersionFactoryFields = InsertCallScenarioVersion;

const callScenarioFactory = Factory.define<CallScenarioFactoryFields>(
	({ params, sequence }) => ({
		id: uuidv4(),
		organizationId: params.organizationId ?? "",
		ownerId: params.ownerId ?? null,
		name: params.name ?? `Test Call Scenario ${sequence}`,
		description: params.description ?? `Description for scenario ${sequence}`,
		vertical: params.vertical ?? "sales",
		createdAt: new Date(),
		updatedAt: new Date(),
	}),
);

const defaultContent = (sequence: number): CallScript => ({
	vertical: "sales",
	stages: [{ name: "Opening", script: `Default script ${sequence}` }],
});

const callScenarioVersionFactory =
	Factory.define<CallScenarioVersionFactoryFields>(
		({ params, sequence }) => ({
			id: uuidv4(),
			callScenarioId: params.callScenarioId ?? "",
			ownerId: params.ownerId ?? null,
			version: params.version ?? 1,
			content: (params.content as CallScript | undefined) ?? defaultContent(sequence),
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
	);

/**
 * Creates a test call scenario
 * @param overrides - Optional overrides for the call scenario creation
 * @returns The created call scenario
 */
async function createTestCallScenario(
	overrides?: Partial<CallScenarioFactoryFields>,
) {
	const db = getDb();
	const callScenarioData = callScenarioFactory.build(overrides);

	const [newCallScenario] = await db
		.insert(callScenarios)
		.values(callScenarioData)
		.returning();
	return newCallScenario;
}

/**
 * Creates a test call scenario version
 * @param overrides - Optional overrides for the version creation
 * @returns The created call scenario version
 */
async function createTestCallScenarioVersion(
	overrides?: Partial<CallScenarioVersionFactoryFields>,
) {
	const db = getDb();
	const versionData = callScenarioVersionFactory.build(overrides) as InsertCallScenarioVersion;

	const [newVersion] = await db
		.insert(callScenarioVersions)
		.values(versionData)
		.returning();
	return newVersion;
}

/**
 * Creates a test call scenario with an initial version
 * @param scenarioOverrides - Optional overrides for the scenario
 * @param versionOverrides - Optional overrides for the version
 * @returns The created scenario and version
 */
async function createTestCallScenarioWithVersion(
	scenarioOverrides?: Partial<CallScenarioFactoryFields>,
	versionOverrides?: Partial<Omit<CallScenarioVersionFactoryFields, "callScenarioId">>,
) {
	const scenario = await createTestCallScenario(scenarioOverrides);
	const version = await createTestCallScenarioVersion({
		...versionOverrides,
		callScenarioId: scenario.id,
		ownerId: versionOverrides?.ownerId ?? scenarioOverrides?.ownerId ?? null,
	});
	return { scenario, version };
}

/**
 * Creates multiple test call scenarios
 * @param count - Number of scenarios to create
 * @param organizationId - Organization ID for the scenarios
 * @param ownerId - Owner ID for the scenarios
 * @param overrides - Optional overrides for the scenario creation
 * @returns Array of created scenarios
 */
async function createMultipleTestCallScenarios(
	count: number,
	organizationId: string,
	ownerId: string | null,
	overrides?: Partial<CallScenarioFactoryFields>,
) {
	const scenarios: Awaited<ReturnType<typeof createTestCallScenario>>[] = [];
	for (let i = 0; i < count; i++) {
		const scenario = await createTestCallScenario({
			...overrides,
			organizationId,
			ownerId,
		});
		scenarios.push(scenario);
	}
	return scenarios;
}

/**
 * Creates multiple test call scenarios with versions
 * @param count - Number of scenarios to create
 * @param organizationId - Organization ID for the scenarios
 * @param ownerId - Owner ID for the scenarios
 * @param scenarioOverrides - Optional overrides for the scenario creation
 * @param versionOverrides - Optional overrides for the version creation
 * @returns Array of created scenarios with versions
 */
async function createMultipleTestCallScenariosWithVersions(
	count: number,
	organizationId: string,
	ownerId: string | null,
	scenarioOverrides?: Partial<CallScenarioFactoryFields>,
	versionOverrides?: Partial<Omit<CallScenarioVersionFactoryFields, "callScenarioId">>,
) {
	const results: Awaited<ReturnType<typeof createTestCallScenarioWithVersion>>[] = [];
	for (let i = 0; i < count; i++) {
		const result = await createTestCallScenarioWithVersion(
			{
				...scenarioOverrides,
				organizationId,
				ownerId,
			},
			versionOverrides,
		);
		results.push(result);
	}
	return results;
}

export {
	callScenarioFactory,
	callScenarioVersionFactory, createMultipleTestCallScenarios,
	createMultipleTestCallScenariosWithVersions, createTestCallScenario,
	createTestCallScenarioVersion,
	createTestCallScenarioWithVersion
};
