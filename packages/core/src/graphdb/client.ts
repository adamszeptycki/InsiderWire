import "neo4j-driver";
import { getSecret } from "/core/src/config/secret";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";


async function getGraphDbClient() {
    const url = await getSecret("GRAPHDB_URL");
    const username = await getSecret("GRAPHDB_USERNAME");
    const password = await getSecret("GRAPHDB_PASSWORD");
    const graph = await Neo4jGraph.initialize({ url, username, password });
    return graph;
}
export { getGraphDbClient };