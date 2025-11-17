import { CloudDownload, InfoOutline } from '@mui/icons-material';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { lt, valid } from 'semver';

export default function Version() {
  const [version, setVersion] = useState('');
  const [versionLatest, setVersionLatest] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const versionPromise = window.electron.getVersion();
      const versionLatestPromise = window.electron.getVersionLatest();
      const initVersion = await versionPromise;
      const initVersionLatest = await versionLatestPromise;
      setVersion(initVersion);
      setVersionLatest(initVersionLatest);
      if (
        valid(initVersion) &&
        valid(initVersionLatest) &&
        lt(initVersion, initVersionLatest)
      ) {
        setOpen(true);
      }
    })();
  }, []);

  return (
    <>
      <Tooltip arrow title="Version">
        <Fab
          onClick={() => setOpen(true)}
          size="small"
          style={{ position: 'fixed', bottom: 8, left: 8 }}
        >
          <InfoOutline />
        </Fab>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          marginRight="24px"
        >
          <DialogTitle>Auto Config for Slippi</DialogTitle>
          <Typography variant="caption">v{version}</Typography>
        </Stack>
        {valid(version) &&
          valid(versionLatest) &&
          lt(version, versionLatest) && (
            <DialogContent>
              <Alert
                severity="warning"
                style={{ marginTop: '8px' }}
                action={
                  <Button
                    endIcon={<CloudDownload />}
                    variant="contained"
                    onClick={() => {
                      window.electron.update();
                    }}
                  >
                    Quit and download
                  </Button>
                }
              >
                Update available! v{versionLatest}
              </Alert>
            </DialogContent>
          )}
      </Dialog>
    </>
  );
}
