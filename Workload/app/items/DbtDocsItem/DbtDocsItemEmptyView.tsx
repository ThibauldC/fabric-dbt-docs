import React from "react";
import { useTranslation } from "react-i18next";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { DbtDocsItemDefinition } from "./DbtDocsItemDefinition";
import { ItemEditorEmptyView, EmptyStateTask } from "../../components/ItemEditor";
import "./DbtDocsItem.scss";

interface DbtDocsItemEmptyViewProps {
  workloadClient: WorkloadClientAPI;
  item?: ItemWithDefinition<DbtDocsItemDefinition>;
  onNavigateToDocs: () => void;
}

export function DbtDocsItemEmptyView({
  workloadClient,
  item,
  onNavigateToDocs
}: DbtDocsItemEmptyViewProps) {
  const { t } = useTranslation();

  const tasks: EmptyStateTask[] = [
    {
      id: "select-docs",
      label: t("DbtDocsItemEmptyView_StartButton", "Select docs folder"),
      description: t("DbtDocsItemEmptyView_StartDescription", "Point this item to a dbt docs output folder."),
      onClick: onNavigateToDocs
    }
  ];

  return (
    <ItemEditorEmptyView
      title={t("DbtDocsItemEmptyView_Title", "Welcome to dbt Docs")}
      description={t(
        "DbtDocsItemEmptyView_Description",
        "Connect a dbt docs output folder (index.html, manifest.json, catalog.json) to start browsing documentation."
      )}
      imageSrc="/assets/items/DbtDocsItem/EditorEmpty.svg"
      imageAlt="dbt docs empty state"
      tasks={tasks}
    />
  );
}
