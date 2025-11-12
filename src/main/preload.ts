import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Config, SdCard } from '../common/types';

const electronHandler = {
  getIsoPath: (): Promise<string> => ipcRenderer.invoke('getIsoPath'),
  chooseIsoPath: (): Promise<string> => ipcRenderer.invoke('chooseIsoPath'),
  getSlippiNintendontPath: (): Promise<string> =>
    ipcRenderer.invoke('getSlippiNintendontPath'),
  chooseSlippiNintendontPath: (): Promise<string> =>
    ipcRenderer.invoke('chooseSlippiNintendontPath'),
  resetSlippiNintendontPath: (): Promise<string> =>
    ipcRenderer.invoke('resetSlippiNintendontPath'),
  getCodePath: (): Promise<string> => ipcRenderer.invoke('getCodePath'),
  chooseCodePath: (): Promise<string> => ipcRenderer.invoke('chooseCodePath'),
  resetCodePath: (): Promise<string> => ipcRenderer.invoke('resetCodePath'),
  getConfig: (): Promise<Config> => ipcRenderer.invoke('getConfig'),
  setConfig: (config: Config): Promise<void> =>
    ipcRenderer.invoke('setConfig', config),
  getSdCards: (): Promise<SdCard[]> => ipcRenderer.invoke('getSdCards'),
  getForwarderVersion: (): Promise<string> =>
    ipcRenderer.invoke('getForwarderVersion'),
  getSlippiNintendontVersion: (): Promise<string> =>
    ipcRenderer.invoke('getSlippiNintendontVersion'),
  copyIso: (sdCard: SdCard): Promise<void> =>
    ipcRenderer.invoke('copyIso', sdCard),
  copyApps: (sdCard: SdCard): Promise<void> =>
    ipcRenderer.invoke('copyApps', sdCard),
  writeConfig: (sdCard: SdCard): Promise<void> =>
    ipcRenderer.invoke('writeConfig', sdCard),
  ejectSdCard: (key: string): Promise<void> =>
    ipcRenderer.invoke('ejectSdCard', key),
  getVersion: (): Promise<string> => ipcRenderer.invoke('getVersion'),
  getVersionLatest: (): Promise<string> =>
    ipcRenderer.invoke('getVersionLatest'),
  update: (): void => ipcRenderer.send('update'),
  onProgress: (
    callback: (
      event: IpcRendererEvent,
      progress: { key: string; percent: number }[],
    ) => void,
  ) => {
    ipcRenderer.removeAllListeners('progress');
    ipcRenderer.on('progress', callback);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
export type ElectronHandler = typeof electronHandler;
