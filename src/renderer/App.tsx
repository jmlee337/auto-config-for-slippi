import { Album, Restore, VideogameAsset } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import SdCards from './SdCards';
import ConfigEl from './Config';
import Version from './Version';

export default function App() {
  const [errorMessage, setErrorMessage] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const openErrorMessage = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorOpen(true);
  }, []);

  const [isoPath, setIsoPath] = useState('');
  const [slippiNintendontPath, setSlippiNintendontPath] = useState('');
  const [slippiNintendontVersion, setSlippiNintendontVersion] = useState('');

  useEffect(() => {
    (async () => {
      const isoPathPromise = window.electron.getIsoPath();
      const slippiNintendontPathPromise =
        window.electron.getSlippiNintendontPath();
      const slippiNintendontVersionPromise =
        window.electron.getSlippiNintendontVersion();
      setIsoPath(await isoPathPromise);
      setSlippiNintendontPath(await slippiNintendontPathPromise);
      setSlippiNintendontVersion(await slippiNintendontVersionPromise);
    })();
  }, []);

  return (
    <>
      <Stack direction="row">
        <InputBase
          disabled
          size="small"
          value={isoPath || 'Set Melee ISO path...'}
          style={{ flexGrow: 1 }}
        />
        <Tooltip arrow title="Set Melee ISO path">
          <IconButton
            onClick={async () => {
              try {
                setIsoPath(await window.electron.chooseIsoPath());
              } catch (e: unknown) {
                openErrorMessage(
                  e instanceof Error ? e.message : JSON.stringify(e ?? ''),
                );
              }
            }}
          >
            <Album />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack direction="row">
        <InputBase
          disabled
          size="small"
          value={
            slippiNintendontPath
              ? `Custom Slippi Nintendont version: ${slippiNintendontVersion}`
              : `Default Slippi Nintendont version: ${slippiNintendontVersion}`
          }
          style={{ flexGrow: 1 }}
        />
        {slippiNintendontPath && (
          <Tooltip arrow title="Reset to default Slippi Nintendont">
            <IconButton
              onClick={async () => {
                setSlippiNintendontPath(
                  await window.electron.resetSlippiNintendontPath(),
                );
                setSlippiNintendontVersion(
                  await window.electron.getSlippiNintendontVersion(),
                );
              }}
            >
              <Restore />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip arrow title="Set Slippi Nintendont">
          <IconButton
            onClick={async () => {
              setSlippiNintendontPath(
                await window.electron.chooseSlippiNintendontPath(),
              );
              setSlippiNintendontVersion(
                await window.electron.getSlippiNintendontVersion(),
              );
            }}
          >
            <VideogameAsset />
          </IconButton>
        </Tooltip>
      </Stack>
      <ConfigEl />
      <SdCards
        slippiNintendontVersion={slippiNintendontVersion}
        openErrorMessage={openErrorMessage}
      />
      <Version />
      <Dialog
        open={errorOpen}
        onClose={() => {
          setErrorOpen(false);
        }}
      >
        <DialogTitle>Error!</DialogTitle>
        <DialogContent>
          <DialogContentText>{errorMessage}</DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
}
