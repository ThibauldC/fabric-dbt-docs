import React from "react";
import { PageProps } from '../../App';
import {
  Ribbon,
  RibbonAction,
  RibbonActionButton,
  createSaveAction,
  createSettingsAction
} from '../../components/ItemEditor';
import { ArrowClockwise24Regular } from '@fluentui/react-icons';
import { ViewContext } from '../../components';
import { useTranslation } from "react-i18next";

export interface DbtDocsItemRibbonProps extends PageProps {
  isSaveButtonEnabled?: boolean;
  viewContext: ViewContext;
  saveItemCallback: () => Promise<void>;
  openSettingsCallback: () => Promise<void>;
  refreshDocsCallback: () => Promise<void>;
}

export function DbtDocsItemRibbon(props: DbtDocsItemRibbonProps) {
  const { t } = useTranslation();
  const { viewContext } = props;

  const saveAction = createSaveAction(
    props.saveItemCallback,
    !props.isSaveButtonEnabled
  );

  const settingsAction = createSettingsAction(
    props.openSettingsCallback
  );

  const homeToolbarActions: RibbonAction[] = [
    saveAction,
    settingsAction,
    {
      key: 'refresh-docs',
      icon: ArrowClockwise24Regular,
      label: t('DbtDocsItemRibbon_Refresh_Label', 'Refresh docs'),
      tooltip: t('DbtDocsItemRibbon_Refresh_Tooltip', 'Reload docs files from OneLake'),
      onClick: props.refreshDocsCallback,
      testId: 'ribbon-refresh-docs-btn'
    }
  ];

  const rightActionButtons: RibbonActionButton[] = [];

  return (
    <Ribbon
      homeToolbarActions={homeToolbarActions}
      rightActionButtons={rightActionButtons}
      viewContext={viewContext}
    />
  );
}
