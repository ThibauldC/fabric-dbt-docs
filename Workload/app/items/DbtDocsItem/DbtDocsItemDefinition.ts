/***
 * Interface representing the definition of a DbtDocs item.
 * This information is stored in Fabric as Item definition.
 */
export interface DbtDocsItemDefinition {
  docsFolder?: string;
  sourceItem?: {
    id: string;
    workspaceId: string;
    displayName: string;
  };
}
