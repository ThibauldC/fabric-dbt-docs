import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { Card, Field, Input, Button, Spinner, Text } from "@fluentui/react-components";
import { ItemEditorDefaultView } from "../../components/ItemEditor";
import { OneLakeView } from "../../components/OneLakeView";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { DbtDocsItemDefinition } from "./DbtDocsItemDefinition";
import { OneLakeStorageClient } from "../../clients/OneLakeStorageClient";
import { Item } from "../../clients/FabricPlatformTypes";
import "./DbtDocsItem.scss";

const INDEX_FILE_NAME = "index.html";
const MANIFEST_FILE_NAME = "manifest.json";
const CATALOG_FILE_NAME = "catalog.json";

interface DbtDocsItemDefaultViewProps {
  workloadClient: WorkloadClientAPI;
  item?: ItemWithDefinition<DbtDocsItemDefinition>;
  docsFolder?: string;
  sourceItem?: {
    id: string;
    workspaceId: string;
    displayName: string;
  };
  onDocsFolderChange: (value: string) => void;
  onSourceItemChange: (item?: Item) => void;
  onSaveRequested: () => Promise<void>;
  refreshToken: number;
}

export function DbtDocsItemDefaultView({
  workloadClient,
  item,
  docsFolder,
  sourceItem,
  onDocsFolderChange,
  onSourceItemChange,
  onSaveRequested,
  refreshToken
}: DbtDocsItemDefaultViewProps) {
  const { t } = useTranslation();
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");

  const docsPath = useMemo(() => {
    if (!docsFolder) {
      return "";
    }
    const trimmed = docsFolder.trim();
    if (!trimmed) {
      return "";
    }
    return trimmed.replace(/\/$/, "");
  }, [docsFolder]);

  // Don't fallback to current item - let OneLakeView show "Select Item" empty state
  const resolvedSourceItem = sourceItem;

  const isDocsReady = Boolean(docsPath);

  useEffect(() => {
    const fetchDocs = async () => {
      if (!resolvedSourceItem || !docsPath) {
        setHtmlContent("");
        setLoadError("");
        return;
      }

      setIsLoadingDocs(true);
      setLoadError("");
      try {
        const oneLakeClient = new OneLakeStorageClient(workloadClient);
        const wrapper = oneLakeClient.createItemWrapper({
          id: resolvedSourceItem.id,
          workspaceId: resolvedSourceItem.workspaceId
        });

        const htmlPath = `${docsPath}/${INDEX_FILE_NAME}`;
        const manifestPath = `${docsPath}/${MANIFEST_FILE_NAME}`;
        const catalogPath = `${docsPath}/${CATALOG_FILE_NAME}`;

        const [htmlExists, manifestExists, catalogExists] = await Promise.all([
          wrapper.checkIfFileExists(htmlPath),
          wrapper.checkIfFileExists(manifestPath),
          wrapper.checkIfFileExists(catalogPath)
        ]);

        if (!htmlExists || !manifestExists || !catalogExists) {
          const missing = [
            htmlExists ? null : INDEX_FILE_NAME,
            manifestExists ? null : MANIFEST_FILE_NAME,
            catalogExists ? null : CATALOG_FILE_NAME
          ].filter(Boolean).join(", ");
          setHtmlContent("");
          setLoadError(
            t("DbtDocsItemDocs_MissingFiles", "Missing required docs files: {{files}}", {
              files: missing
            })
          );
          return;
        }

        const html = await wrapper.readFileAsText(htmlPath);
        let normalized = html
          .replace(/manifest\.json/g, `${docsPath}/${MANIFEST_FILE_NAME}`)
          .replace(/catalog\.json/g, `${docsPath}/${CATALOG_FILE_NAME}`);

        setHtmlContent(normalized);
      } catch (error) {
        console.error("Failed to load dbt docs", error);
        setLoadError(t("DbtDocsItemDocs_LoadError", "Failed to load dbt docs from OneLake."));
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [resolvedSourceItem, docsPath, workloadClient, refreshToken, t]);

  const leftPanel = (
    <div className="dbt-docs-view">
      <div className="dbt-docs-section">
        <h2 className="dbt-docs-section-title">
          {t("DbtDocsItemConfig_Title", "Docs source")}
        </h2>
        <p className="dbt-docs-section-description">
          {t(
            "DbtDocsItemConfig_Description",
            "Point to the folder in this item that contains index.html, manifest.json, and catalog.json."
          )}
        </p>
        <p className="dbt-docs-section-description">
          {t(
            "DbtDocsItemConfig_SourceDescription",
            "Choose the OneLake item (for example, a Lakehouse) that stores your dbt docs output."
          )}
        </p>

        <Field
          label={t("DbtDocsItemConfig_SourceLabel", "OneLake item")}
          hint={resolvedSourceItem?.displayName || t("DbtDocsItemConfig_SourceHint", "Select the item that contains your docs")}
        />
        <Field label={t("DbtDocsItemConfig_PathLabel", "Docs folder path")}>
          <Input
            value={docsFolder || ""}
            onChange={(_, data) => onDocsFolderChange(data.value)}
            placeholder={t("DbtDocsItemConfig_PathPlaceholder", "Files/dbt-docs")}
          />
        </Field>
        <Button
          appearance="primary"
          className="dbt-docs-save-button"
          onClick={onSaveRequested}
        >
          {t("DbtDocsItemConfig_SaveButton", "Save path")}
        </Button>
      </div>
      <div className="dbt-docs-section">
        <h3 className="dbt-docs-section-subtitle">
          {t("DbtDocsItemBrowser_Title", "Browse OneLake")}
        </h3>
        <div className="dbt-docs-onelake-view">
          <OneLakeView
            workloadClient={workloadClient}
            config={{
              mode: "view",
              allowItemSelection: true,
              initialItem: resolvedSourceItem,
              refreshTrigger: refreshToken
            }}
            callbacks={{
              onFileSelected: async (fileName, oneLakeLink) => {
                if (fileName.endsWith(INDEX_FILE_NAME)) {
                  const folder = oneLakeLink
                    .replace(/\/index\.html$/, "")
                    .replace(/\/Files\//, "Files/");
                  onDocsFolderChange(folder);
                }
              },
              onItemChanged: async (selectedItem) => {
                onSourceItemChange(selectedItem);
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  const centerPanel = (
    <div className="dbt-docs-view">
      <div className="dbt-docs-preview-header">
        <div>
          <h1 className="dbt-docs-title">
            {t("DbtDocsItemPreview_Title", "dbt Docs")}
          </h1>
          <p className="dbt-docs-subtitle">
            {resolvedSourceItem && docsPath
              ? t("DbtDocsItemPreview_Subtitle", "Showing docs from {{path}}", { path: docsPath })
              : t("DbtDocsItemPreview_SubtitleEmpty", "Select a docs folder to preview.")}
          </p>
        </div>
        <div className="dbt-docs-status">
          {isLoadingDocs && <Spinner label={t("DbtDocsItemDocs_Loading", "Loading docs...")} />}
          {!isLoadingDocs && loadError && (
            <Text className="dbt-docs-error" weight="semibold">
              {loadError}
            </Text>
          )}
        </div>
      </div>
      <Card className="dbt-docs-preview-card">
        {(!resolvedSourceItem || !isDocsReady) && (
          <div className="dbt-docs-placeholder">
            <Text>
              {t("DbtDocsItemPreview_Empty", "Choose a docs folder to render the documentation.")}
            </Text>
          </div>
        )}
        {resolvedSourceItem && isDocsReady && !isLoadingDocs && !loadError && (
          <iframe
            title={t("DbtDocsItemPreview_IframeTitle", "dbt docs preview")}
            className="dbt-docs-frame"
            srcDoc={htmlContent}
          />
        )}
      </Card>
    </div>
  );

  return (
    <ItemEditorDefaultView
      left={{
        content: leftPanel,
        title: t("DbtDocsItem_LeftPanel_Title", "Docs source"),
        width: 360,
        minWidth: 320,
        enableUserResize: true,
        collapsible: true
      }}
      center={{
        content: centerPanel,
        ariaLabel: t("DbtDocsItemPreview_Aria", "dbt docs preview")
      }}
    />
  );
}
