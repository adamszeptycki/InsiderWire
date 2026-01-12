import { describe, expect, it } from "vitest";
import { Form4Parser } from "./parser";

describe("Form4Parser", () => {
	const parser = new Form4Parser();

	describe("parse", () => {
		it("should parse a valid Form 4 with buy transaction", () => {
			const xml = `
				<?xml version="1.0"?>
				<ownershipDocument>
					<issuer>
						<issuerCik>0000320193</issuerCik>
						<issuerName>Apple Inc.</issuerName>
						<issuerTradingSymbol>AAPL</issuerTradingSymbol>
					</issuer>
					<reportingOwner>
						<reportingOwnerId>
							<rptOwnerCik>0001234567</rptOwnerCik>
							<rptOwnerName>Tim Cook</rptOwnerName>
						</reportingOwnerId>
						<reportingOwnerRelationship>
							<isDirector>0</isDirector>
							<isOfficer>1</isOfficer>
							<isTenPercentOwner>0</isTenPercentOwner>
							<isOther>0</isOther>
							<officerTitle>Chief Executive Officer</officerTitle>
						</reportingOwnerRelationship>
					</reportingOwner>
					<nonDerivativeTable>
						<nonDerivativeTransaction>
							<securityTitle>
								<value>Common Stock</value>
							</securityTitle>
							<transactionDate>
								<value>2024-01-15</value>
							</transactionDate>
							<transactionCoding>
								<transactionCode>P</transactionCode>
							</transactionCoding>
							<transactionAmounts>
								<transactionShares>
									<value>10000</value>
								</transactionShares>
								<transactionPricePerShare>
									<value>150.50</value>
								</transactionPricePerShare>
							</transactionAmounts>
							<postTransactionAmounts>
								<sharesOwnedFollowingTransaction>
									<value>500000</value>
								</sharesOwnedFollowingTransaction>
							</postTransactionAmounts>
							<ownershipNature>
								<directOrIndirectOwnership>
									<value>D</value>
								</directOrIndirectOwnership>
							</ownershipNature>
						</nonDerivativeTransaction>
					</nonDerivativeTable>
				</ownershipDocument>
			`;

			const result = parser.parse(xml, "0001234567-24-000001", "2024-01-16");

			expect(result.accessionNumber).toBe("0001234567-24-000001");
			expect(result.filingDate).toBe("2024-01-16");

			// Issuer
			expect(result.issuer.cik).toBe("320193"); // Leading zeros removed
			expect(result.issuer.companyName).toBe("Apple Inc.");
			expect(result.issuer.ticker).toBe("AAPL");

			// Insider
			expect(result.insider.name).toBe("Tim Cook");
			expect(result.insider.title).toBe("Chief Executive Officer");
			expect(result.insider.isOfficer).toBe(true);
			expect(result.insider.isDirector).toBe(false);

			// Transaction
			expect(result.transactions).toHaveLength(1);
			const tx = result.transactions[0];
			expect(tx.transactionCode).toBe("P");
			expect(tx.transactionDate).toBe("2024-01-15");
			expect(tx.shares).toBe(10000);
			expect(tx.pricePerShare).toBe(150.50);
			expect(tx.transactionValue).toBe(1505000);
			expect(tx.postTransactionShares).toBe(500000);
			expect(tx.isDirectOwnership).toBe(true);
			expect(tx.is10b51).toBe(false);
		});

		it("should parse a sell transaction", () => {
			const xml = `
				<?xml version="1.0"?>
				<ownershipDocument>
					<issuer>
						<issuerCik>0000789019</issuerCik>
						<issuerName>Microsoft Corporation</issuerName>
						<issuerTradingSymbol>MSFT</issuerTradingSymbol>
					</issuer>
					<reportingOwner>
						<reportingOwnerId>
							<rptOwnerName>Satya Nadella</rptOwnerName>
						</reportingOwnerId>
						<reportingOwnerRelationship>
							<isDirector>0</isDirector>
							<isOfficer>1</isOfficer>
							<isTenPercentOwner>0</isTenPercentOwner>
							<isOther>0</isOther>
							<officerTitle>CEO</officerTitle>
						</reportingOwnerRelationship>
					</reportingOwner>
					<nonDerivativeTable>
						<nonDerivativeTransaction>
							<transactionDate>
								<value>2024-02-01</value>
							</transactionDate>
							<transactionCoding>
								<transactionCode>S</transactionCode>
							</transactionCoding>
							<transactionAmounts>
								<transactionShares>
									<value>25000</value>
								</transactionShares>
								<transactionPricePerShare>
									<value>375.25</value>
								</transactionPricePerShare>
							</transactionAmounts>
							<postTransactionAmounts>
								<sharesOwnedFollowingTransaction>
									<value>1000000</value>
								</sharesOwnedFollowingTransaction>
							</postTransactionAmounts>
							<ownershipNature>
								<directOrIndirectOwnership>
									<value>D</value>
								</directOrIndirectOwnership>
							</ownershipNature>
						</nonDerivativeTransaction>
					</nonDerivativeTable>
				</ownershipDocument>
			`;

			const result = parser.parse(xml, "0001234567-24-000002", "2024-02-02");

			expect(result.transactions).toHaveLength(1);
			const tx = result.transactions[0];
			expect(tx.transactionCode).toBe("S");
			expect(tx.shares).toBe(25000);
			expect(tx.pricePerShare).toBe(375.25);
			expect(tx.transactionValue).toBe(9381250);
		});

		it("should detect 10b5-1 plan from footnotes", () => {
			const xml = `
				<?xml version="1.0"?>
				<ownershipDocument>
					<issuer>
						<issuerCik>0000012345</issuerCik>
						<issuerName>Test Company</issuerName>
					</issuer>
					<reportingOwner>
						<reportingOwnerId>
							<rptOwnerName>John Doe</rptOwnerName>
						</reportingOwnerId>
						<reportingOwnerRelationship>
							<isDirector>1</isDirector>
							<isOfficer>0</isOfficer>
							<isTenPercentOwner>0</isTenPercentOwner>
							<isOther>0</isOther>
						</reportingOwnerRelationship>
					</reportingOwner>
					<nonDerivativeTable>
						<nonDerivativeTransaction>
							<transactionDate>
								<value>2024-03-01</value>
							</transactionDate>
							<transactionCoding>
								<transactionCode>P</transactionCode>
							</transactionCoding>
							<transactionAmounts>
								<transactionShares>
									<value>5000</value>
								</transactionShares>
								<transactionPricePerShare>
									<value>50.00</value>
								</transactionPricePerShare>
							</transactionAmounts>
							<postTransactionAmounts>
								<sharesOwnedFollowingTransaction>
									<value>50000</value>
								</sharesOwnedFollowingTransaction>
							</postTransactionAmounts>
							<ownershipNature>
								<directOrIndirectOwnership>
									<value>D</value>
								</directOrIndirectOwnership>
							</ownershipNature>
							<footnoteId id="F1"/>
						</nonDerivativeTransaction>
					</nonDerivativeTable>
					<footnotes>
						<footnote id="F1">This transaction was made pursuant to a Rule 10b5-1 trading plan.</footnote>
					</footnotes>
				</ownershipDocument>
			`;

			const result = parser.parse(xml, "0001234567-24-000003", "2024-03-02");

			expect(result.transactions).toHaveLength(1);
			expect(result.transactions[0].is10b51).toBe(true);
		});

		it("should filter out non-P/S transactions", () => {
			const xml = `
				<?xml version="1.0"?>
				<ownershipDocument>
					<issuer>
						<issuerCik>0000012345</issuerCik>
						<issuerName>Test Company</issuerName>
					</issuer>
					<reportingOwner>
						<reportingOwnerId>
							<rptOwnerName>Jane Doe</rptOwnerName>
						</reportingOwnerId>
						<reportingOwnerRelationship>
							<isDirector>1</isDirector>
							<isOfficer>0</isOfficer>
							<isTenPercentOwner>0</isTenPercentOwner>
							<isOther>0</isOther>
						</reportingOwnerRelationship>
					</reportingOwner>
					<nonDerivativeTable>
						<nonDerivativeTransaction>
							<transactionDate>
								<value>2024-03-01</value>
							</transactionDate>
							<transactionCoding>
								<transactionCode>A</transactionCode>
							</transactionCoding>
							<transactionAmounts>
								<transactionShares>
									<value>1000</value>
								</transactionShares>
								<transactionPricePerShare>
									<value>0.00</value>
								</transactionPricePerShare>
							</transactionAmounts>
							<postTransactionAmounts>
								<sharesOwnedFollowingTransaction>
									<value>10000</value>
								</sharesOwnedFollowingTransaction>
							</postTransactionAmounts>
							<ownershipNature>
								<directOrIndirectOwnership>
									<value>D</value>
								</directOrIndirectOwnership>
							</ownershipNature>
						</nonDerivativeTransaction>
						<nonDerivativeTransaction>
							<transactionDate>
								<value>2024-03-01</value>
							</transactionDate>
							<transactionCoding>
								<transactionCode>P</transactionCode>
							</transactionCoding>
							<transactionAmounts>
								<transactionShares>
									<value>5000</value>
								</transactionShares>
								<transactionPricePerShare>
									<value>100.00</value>
								</transactionPricePerShare>
							</transactionAmounts>
							<postTransactionAmounts>
								<sharesOwnedFollowingTransaction>
									<value>15000</value>
								</sharesOwnedFollowingTransaction>
							</postTransactionAmounts>
							<ownershipNature>
								<directOrIndirectOwnership>
									<value>D</value>
								</directOrIndirectOwnership>
							</ownershipNature>
						</nonDerivativeTransaction>
					</nonDerivativeTable>
				</ownershipDocument>
			`;

			const result = parser.parse(xml, "0001234567-24-000004", "2024-03-02");

			// Should only include the P transaction, not the A (award/grant)
			expect(result.transactions).toHaveLength(1);
			expect(result.transactions[0].transactionCode).toBe("P");
		});

		it("should handle indirect ownership", () => {
			const xml = `
				<?xml version="1.0"?>
				<ownershipDocument>
					<issuer>
						<issuerCik>0000012345</issuerCik>
						<issuerName>Test Company</issuerName>
					</issuer>
					<reportingOwner>
						<reportingOwnerId>
							<rptOwnerName>Board Member</rptOwnerName>
						</reportingOwnerId>
						<reportingOwnerRelationship>
							<isDirector>1</isDirector>
							<isOfficer>0</isOfficer>
							<isTenPercentOwner>0</isTenPercentOwner>
							<isOther>0</isOther>
						</reportingOwnerRelationship>
					</reportingOwner>
					<nonDerivativeTable>
						<nonDerivativeTransaction>
							<transactionDate>
								<value>2024-03-15</value>
							</transactionDate>
							<transactionCoding>
								<transactionCode>P</transactionCode>
							</transactionCoding>
							<transactionAmounts>
								<transactionShares>
									<value>2000</value>
								</transactionShares>
								<transactionPricePerShare>
									<value>75.00</value>
								</transactionPricePerShare>
							</transactionAmounts>
							<postTransactionAmounts>
								<sharesOwnedFollowingTransaction>
									<value>10000</value>
								</sharesOwnedFollowingTransaction>
							</postTransactionAmounts>
							<ownershipNature>
								<directOrIndirectOwnership>
									<value>I</value>
								</directOrIndirectOwnership>
							</ownershipNature>
						</nonDerivativeTransaction>
					</nonDerivativeTable>
				</ownershipDocument>
			`;

			const result = parser.parse(xml, "0001234567-24-000005", "2024-03-16");

			expect(result.transactions).toHaveLength(1);
			expect(result.transactions[0].isDirectOwnership).toBe(false);
		});

		it("should handle missing optional fields gracefully", () => {
			const xml = `
				<?xml version="1.0"?>
				<ownershipDocument>
					<issuer>
						<issuerCik>0000012345</issuerCik>
						<issuerName>Test Company</issuerName>
					</issuer>
					<reportingOwner>
						<reportingOwnerId>
							<rptOwnerName>Unnamed Insider</rptOwnerName>
						</reportingOwnerId>
						<reportingOwnerRelationship>
							<isDirector>0</isDirector>
							<isOfficer>0</isOfficer>
							<isTenPercentOwner>1</isTenPercentOwner>
							<isOther>0</isOther>
						</reportingOwnerRelationship>
					</reportingOwner>
					<nonDerivativeTable>
						<nonDerivativeTransaction>
							<transactionDate>
								<value>2024-04-01</value>
							</transactionDate>
							<transactionCoding>
								<transactionCode>S</transactionCode>
							</transactionCoding>
							<transactionAmounts>
								<transactionShares>
									<value>100</value>
								</transactionShares>
								<transactionPricePerShare>
									<value>50.00</value>
								</transactionPricePerShare>
							</transactionAmounts>
							<postTransactionAmounts>
								<sharesOwnedFollowingTransaction>
									<value>9900</value>
								</sharesOwnedFollowingTransaction>
							</postTransactionAmounts>
							<ownershipNature>
								<directOrIndirectOwnership>
									<value>D</value>
								</directOrIndirectOwnership>
							</ownershipNature>
						</nonDerivativeTransaction>
					</nonDerivativeTable>
				</ownershipDocument>
			`;

			const result = parser.parse(xml, "0001234567-24-000006", "2024-04-02");

			expect(result.issuer.ticker).toBeUndefined();
			expect(result.insider.title).toBeUndefined();
			expect(result.insider.isTenPercentOwner).toBe(true);
			expect(result.transactions).toHaveLength(1);
		});
	});
});
