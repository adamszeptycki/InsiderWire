import { getDb } from "/core/src/sql";
import { orgData } from "/core/src/sql/schema/org/data";
import { Factory } from "fishery";
import { v4 as uuidv4 } from 'uuid';

type OrgDataFactoryFields = typeof orgData.$inferInsert;

// Sample ICD-10 data structure for testing
const createICD10Data = (code: string, shortDesc: string, longDesc: string) => ({
    "CODE": code,
    "SHORT DESCRIPTION (VALID ICD-10 FY2025)": shortDesc,
    "LONG DESCRIPTION (VALID ICD-10 FY2025)": longDesc,
    "CATEGORY": "Disease",
    "SUBCATEGORY": "General"
});

function randomICD10Code(): string {
    // Generate a random letter (A-Z)
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    
    // Generate two random numbers (0-9)
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    
    // Generate a random number after the dot (0-9)
    const numAfterDot = Math.floor(Math.random() * 10);
    
    return `${letter}${num1}${num2}.${numAfterDot}`;
}

const orgDataFactory = Factory.define<OrgDataFactoryFields>(({ sequence }) => {
    const icd10Codes = [
        createICD10Data("A00.0", "Cholera due to Vibrio cholerae 01, biovar cholerae", "Cholera due to Vibrio cholerae 01, biovar cholerae"),
        createICD10Data("A00.1", "Cholera due to Vibrio cholerae 01, biovar eltor", "Cholera due to Vibrio cholerae 01, biovar eltor"),
        createICD10Data("A01.0", "Typhoid fever", "Typhoid fever"),
        createICD10Data("A01.1", "Paratyphoid fever A", "Paratyphoid fever A"),
        createICD10Data("A02.0", "Salmonella enteritis", "Salmonella enteritis"),
        createICD10Data("B00.1", "Herpesviral vesicular dermatitis", "Herpesviral vesicular dermatitis"),
        createICD10Data("B00.2", "Herpesviral gingivostomatitis and pharyngotonsillitis", "Herpesviral gingivostomatitis and pharyngotonsillitis"),
        createICD10Data("C00.0", "Malignant neoplasm of external upper lip", "Malignant neoplasm of external upper lip"),
        createICD10Data("C00.1", "Malignant neoplasm of external lower lip", "Malignant neoplasm of external lower lip"),
        createICD10Data("D50.0", "Iron deficiency anemia secondary to blood loss (chronic)", "Iron deficiency anemia secondary to blood loss (chronic)"),
        createICD10Data("E10.0", "Type 1 diabetes mellitus with ketoacidosis", "Type 1 diabetes mellitus with ketoacidosis"),
        createICD10Data("E11.0", "Type 2 diabetes mellitus with ketoacidosis", "Type 2 diabetes mellitus with ketoacidosis"),
        createICD10Data("F32.0", "Major depressive disorder, single episode, mild", "Major depressive disorder, single episode, mild"),
        createICD10Data("F32.1", "Major depressive disorder, single episode, moderate", "Major depressive disorder, single episode, moderate"),
        createICD10Data("G40.0", "Localization-related (focal) (partial) idiopathic epilepsy and epileptic syndromes with seizures of localized onset", "Localization-related (focal) (partial) idiopathic epilepsy and epileptic syndromes with seizures of localized onset"),
        createICD10Data("H00.0", "Hordeolum externum", "Hordeolum externum"),
        createICD10Data("H00.1", "Hordeolum internum", "Hordeolum internum"),
        createICD10Data("I10", "Essential hypertension", "Essential hypertension"),
        createICD10Data("I11.0", "Hypertensive heart disease with heart failure", "Hypertensive heart disease with heart failure"),
        createICD10Data("J00", "Acute nasopharyngitis [common cold]", "Acute nasopharyngitis [common cold]"),
        createICD10Data("J01.0", "Acute maxillary sinusitis", "Acute maxillary sinusitis"),
        createICD10Data("K21.0", "Gastro-esophageal reflux disease with esophagitis", "Gastro-esophageal reflux disease with esophagitis"),
        createICD10Data("K21.9", "Gastro-esophageal reflux disease without esophagitis", "Gastro-esophageal reflux disease without esophagitis"),
        createICD10Data("L00.0", "Impetigo", "Impetigo"),
        createICD10Data("M00.0", "Staphylococcal arthritis and polyarthritis", "Staphylococcal arthritis and polyarthritis"),
        createICD10Data("N00.0", "Acute nephritic syndrome with minor glomerular abnormality", "Acute nephritic syndrome with minor glomerular abnormality"),
        createICD10Data("O00.0", "Abdominal pregnancy", "Abdominal pregnancy"),
        createICD10Data("P00.0", "Newborn affected by maternal hypertensive disorders", "Newborn affected by maternal hypertensive disorders"),
        createICD10Data("Q00.0", "Anencephaly", "Anencephaly"),
        createICD10Data("R00.0", "Tachycardia, unspecified", "Tachycardia, unspecified"),
        createICD10Data("S00.0", "Superficial injury of scalp", "Superficial injury of scalp"),
        createICD10Data("T00.0", "Superficial injuries involving head with neck", "Superficial injuries involving head with neck"),
        createICD10Data("U00.0", "COVID-19, virus not identified", "COVID-19, virus not identified"),
        createICD10Data("V00.0", "Pedestrian injured in collision with pedestrian or animal", "Pedestrian injured in collision with pedestrian or animal"),
        createICD10Data("W00.0", "Fall on same level involving ice and snow", "Fall on same level involving ice and snow"),
        createICD10Data("X00.0", "Exposure to uncontrolled fire in building or structure", "Exposure to uncontrolled fire in building or structure"),
        createICD10Data("Y00.0", "Assault by sharp object", "Assault by sharp object"),
        createICD10Data("Z00.0", "Encounter for general adult medical examination without abnormal findings", "Encounter for general adult medical examination without abnormal findings")
    ];

    const selectedCode = icd10Codes[sequence % icd10Codes.length];
    
    return {
        id: uuidv4(),
        organizationId: uuidv4(), // Will be overridden in createTestOrgData
        data: selectedCode,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
});

async function createTestOrgData(overrides?: Partial<OrgDataFactoryFields>, organizationId?: string) {
    const db = getDb();
    const orgDataFields = orgDataFactory.build(overrides);
    
    // Override organizationId if provided
    if (organizationId) {
        orgDataFields.organizationId = organizationId;
    }

    const [newOrgData] = await db.insert(orgData).values(orgDataFields).returning();
    return newOrgData;
}

/**
 * Creates multiple test org data entries for a specific organization
 * @param count - Number of entries to create
 * @param organizationId - Organization ID to associate with the data
 * @param overrides - Optional overrides for the data creation
 * @returns Array of created org data entries
 */
async function createMultipleTestOrgData(
    count: number, 
    organizationId: string, 
    overrides?: Partial<OrgDataFactoryFields>
) {
    const results: Array<Awaited<ReturnType<typeof createTestOrgData>>> = [];
    for (let i = 0; i < count; i++) {
        const data = await createTestOrgData(overrides, organizationId);
        results.push(data);
    }
    return results;
}

/**
 * Creates test org data with specific ICD-10 code data
 * @param codeData - Specific ICD-10 code data to use
 * @param organizationId - Organization ID to associate with the data
 * @param overrides - Optional overrides for the data creation
 * @returns Created org data entry
 */
async function createTestOrgDataWithCode(
    codeData: Record<string, unknown>,
    organizationId: string,
    overrides?: Partial<OrgDataFactoryFields>
) {
    const db = getDb();
    const orgDataFields = orgDataFactory.build({
        ...overrides,
        organizationId,
        data: codeData
    });

    const [newOrgData] = await db.insert(orgData).values(orgDataFields).returning();
    return newOrgData;
}

export { 
    createTestOrgData, 
    orgDataFactory, 
    createMultipleTestOrgData, 
    createTestOrgDataWithCode,
    createICD10Data,
    randomICD10Code
};
