import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NotificationType } from "@ms-fabric/workload-client";
import { PageProps, ContextProps } from "../../App";
import {
  ItemWithDefinition,
  getWorkloadItem,
  callGetItem,
  saveWorkloadItem
} from "../../controller/ItemCRUDController";
import { callOpenSettings } from "../../controller/SettingsController";
import { callNotificationOpen } from "../../controller/NotificationController";
import { ItemEditor, RegisteredNotification, useViewNavigation } from "../../components/ItemEditor";
import { MessageBar, MessageBarBody } from "@fluentui/react-components";
import { Warning20Filled } from "@fluentui/react-icons";
import { DbtDocsItemDefinition } from "./DbtDocsItemDefinition";
import { DbtDocsItemEmptyView } from "./DbtDocsItemEmptyView";
import { DbtDocsItemDefaultView } from "./DbtDocsItemDefaultView";
import { DbtDocsItemRibbon } from "./DbtDocsItemRibbon";
import "./DbtDocsItem.scss";

export const EDITOR_VIEW_TYPES = {
  EMPTY: "empty",
  DEFAULT: "default"
} as const;

const enum SaveStatus {
  NotSaved = "NotSaved",
  Saving = "Saving",
  Saved = "Saved"
}

export function DbtDocsItemEditor(props: PageProps) {
  const { workloadClient } = props;
  const pageContext = useParams<ContextProps>();
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemWithDefinition<DbtDocsItemDefinition>>();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NotSaved);
  const [currentDefinition, setCurrentDefinition] = useState<DbtDocsItemDefinition>({});
  const [viewSetter, setViewSetter] = useState<((view: string) => void) | null>(null);
  const [refreshToken, setRefreshToken] = useState<number>(Date.now());

  async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
    if (pageContext.itemObjectId && item && item.id === pageContext.itemObjectId) {
      console.log(`Item ${pageContext.itemObjectId} is already loaded, skipping reload`);
      return;
    }

    setIsLoading(true);
    let loadedItem: ItemWithDefinition<DbtDocsItemDefinition> = undefined;
    if (pageContext.itemObjectId) {
      try {
        loadedItem = await getWorkloadItem<DbtDocsItemDefinition>(
          workloadClient,
          pageContext.itemObjectId
        );

        if (!loadedItem.definition) {
          setSaveStatus(SaveStatus.NotSaved);
          loadedItem = {
            ...loadedItem,
            definition: {
              docsFolder: undefined,
              sourceItem: undefined
            }
          };
        } else {
          setSaveStatus(SaveStatus.Saved);
        }

        setItem(loadedItem);
        setCurrentDefinition(loadedItem.definition || {});
      } catch (error) {
        setItem(undefined);
      }
    } else {
      console.log(`non-editor context. Current Path: ${pathname}`);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadDataFromUrl(pageContext, pathname);
  }, [pageContext, pathname]);

  const handleOpenSettings = async () => {
    if (item) {
      try {
        const item_res = await callGetItem(workloadClient, item.id);
        await callOpenSettings(workloadClient, item_res.item, "About");
      } catch (error) {
        console.error("Failed to open settings:", error);
      }
    }
  };

  async function saveItem() {
    setSaveStatus(SaveStatus.Saving);
    item.definition = {
      ...currentDefinition,
      docsFolder: currentDefinition.docsFolder?.trim() || undefined,
      sourceItem: currentDefinition.sourceItem
    };
    setCurrentDefinition(item.definition);

    let successResult;
    let errorMessage = "";

    try {
      successResult = await saveWorkloadItem<DbtDocsItemDefinition>(workloadClient, item);
    } catch (error) {
      errorMessage = error?.message;
    }

    const wasSaved = Boolean(successResult);

    if (wasSaved) {
      setSaveStatus(SaveStatus.Saved);
      callNotificationOpen(
        props.workloadClient,
        t("ItemEditor_Saved_Notification_Title"),
        t("ItemEditor_Saved_Notification_Text", { itemName: item.displayName }),
        undefined,
        undefined
      );
    } else {
      setSaveStatus(SaveStatus.NotSaved);
      const failureMessage = errorMessage
        ? `${t("ItemEditor_SaveFailed_Notification_Text", { itemName: item.displayName })} ${errorMessage}.`
        : t("ItemEditor_SaveFailed_Notification_Text", { itemName: item.displayName });

      callNotificationOpen(
        props.workloadClient,
        t("ItemEditor_SaveFailed_Notification_Title"),
        failureMessage,
        NotificationType.Error,
        undefined
      );
    }
  }

  const isSaveEnabled = (currentView: string) => {
    if (currentView === EDITOR_VIEW_TYPES.EMPTY) {
      return false;
    }

    if (saveStatus === SaveStatus.Saved) {
      return false;
    }

    const originalPath = item?.definition?.docsFolder || "";
    const currentPath = currentDefinition.docsFolder || "";
    const originalItem = item?.definition?.sourceItem;
    const currentItem = currentDefinition.sourceItem;

    const sourceChanged = (originalItem?.id || "") !== (currentItem?.id || "")
      || (originalItem?.workspaceId || "") !== (currentItem?.workspaceId || "");

    return sourceChanged || originalPath !== currentPath || !item?.definition?.docsFolder;
  };

  const EmptyViewWrapper = () => {
    const { setCurrentView } = useViewNavigation();

    return (
      <DbtDocsItemEmptyView
        workloadClient={workloadClient}
        item={item}
        onNavigateToDocs={() => {
          setCurrentView(EDITOR_VIEW_TYPES.DEFAULT);
        }}
      />
    );
  };

  const views = [
    {
      name: EDITOR_VIEW_TYPES.EMPTY,
      component: <EmptyViewWrapper />
    },
    {
      name: EDITOR_VIEW_TYPES.DEFAULT,
      component: (
        <DbtDocsItemDefaultView
          workloadClient={workloadClient}
          item={item}
          docsFolder={currentDefinition.docsFolder}
          sourceItem={currentDefinition.sourceItem}
          onDocsFolderChange={(newValue) => {
            setCurrentDefinition(prev => ({ ...prev, docsFolder: newValue }));
            setSaveStatus(SaveStatus.NotSaved);
          }}
          onSourceItemChange={(selectedItem) => {
            if (!selectedItem) {
              return;
            }
            setCurrentDefinition(prev => ({
              ...prev,
              sourceItem: {
                id: selectedItem.id,
                workspaceId: selectedItem.workspaceId,
                displayName: selectedItem.displayName || t("DbtDocsItemConfig_SourceFallback", "Selected item")
              }
            }));
            setSaveStatus(SaveStatus.NotSaved);
          }}
          onSaveRequested={saveItem}
          refreshToken={refreshToken}
        />
      )
    }
  ];

  useEffect(() => {
    if (!isLoading && item && viewSetter) {
      const correctView = !item?.definition?.docsFolder ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT;
      viewSetter(correctView);
    }
  }, [isLoading, item, viewSetter]);

  const notifications: RegisteredNotification[] = [
    {
      name: "missing-docs",
      showInViews: [EDITOR_VIEW_TYPES.DEFAULT],
      component: !currentDefinition.docsFolder || !currentDefinition.sourceItem ? (
        <MessageBar intent="warning" icon={<Warning20Filled />}>
          <MessageBarBody>
            {t("DbtDocsItemDocs_MissingPath", "Select a docs folder in OneLake to preview documentation.")}
          </MessageBarBody>
        </MessageBar>
      ) : null
    }
  ];

  const handleRefreshDocs = async () => {
    setRefreshToken(Date.now());
  };

  return (
    <ItemEditor
      isLoading={isLoading}
      loadingMessage={t("DbtDocsItemEditor_Loading", "Loading dbt docs...")}
      ribbon={(context) => (
        <DbtDocsItemRibbon
          {...props}
          viewContext={context}
          isSaveButtonEnabled={isSaveEnabled(context.currentView)}
          saveItemCallback={saveItem}
          openSettingsCallback={handleOpenSettings}
          refreshDocsCallback={handleRefreshDocs}
        />
      )}
      messageBar={notifications}
      views={views}
      viewSetter={(setCurrentView) => {
        if (!viewSetter) {
          setViewSetter(() => setCurrentView);
        }
      }}
    />
  );
}
