import { useContext, useRef } from 'react'
import './App.scss'
import { observer } from 'mobx-react-lite'
import TableStoreContext from './stores/table'
import { Paper, Snackbar, Stack, Typography } from '@mui/material'
import SelectTable from './components/selectTable'
import CreateTable from './components/createTable'
import WordTable from './components/wordTable'

const App = observer(function () {
  const context = useContext(TableStoreContext);
  const importRef = useRef<HTMLTextAreaElement>();

  if (!context.loaded) {
    return <></>
  }

  if (!context.table) {
    // show new table / load ui
    return <>
      <SelectTable></SelectTable>
      <CreateTable></CreateTable>

      {
        context.importing && <div className="export-overlay">
          <div className="export-overlay-content">
            <Typography variant="h1" gutterBottom>
              Import
            </Typography>
            <textarea ref={importRef as any}></textarea>
            <Stack direction={'row'} justifyContent={'center'} gap={1} sx={{ margin: '0.5rem 0' }}>
              <button onClick={() => {
                context.setImporting(false);
              }}>Schließen</button>
              <button onClick={() => {
                context.importTable(importRef.current?.value || '');
              }}>Importieren</button>
            </Stack>
          </div>
        </div>
      }
      {context.error && <p className='errorArea'>{context.error}</p>}
    </>
  }


  return (
    <>
      <Paper sx={{ padding: 1, width: '100%' }}>

        <Stack direction={'row'} justifyContent={'space-between'}>

          <button onClick={() => {
            context.loadTable(null);
          }}>Back</button>

          <Typography variant="h4" gutterBottom>
            {context.table.name}
          </Typography>

          <button onClick={() => {
            context.exportTable();
          }}>Export</button>
        </Stack>


        <Stack direction={'row'} justifyContent={'center'} gap={1} sx={{ margin: '0.5rem 0' }}>

          <button onClick={(event) => {
            if (context.recognizing) {
              return context.stopListener();
            }
            context.startListener(event.nativeEvent);
          }}>{context.recognizing ? 'Stop' : 'Erkennung'}</button>


          <button onClick={() => {
            context.count();
          }}>Vorzählen</button>
        </Stack>

        <p>{context.interimTranscript[0]}</p>
        <p>{context.interimTranscript[1]}</p>
        <p>{context.error}</p>

        <WordTable></WordTable>

        {
          context.counting && <div className="count-overlay">
            <div className="count-overlay-content">
              <Typography variant="h1" gutterBottom fontSize={'calc(min(30vw, 30vh))'}>
                {context.current === 0 ? context.currentEntry : context.current}
              </Typography>
              <Typography variant="h1" gutterBottom fontSize={'calc(min(5vw, 5vh))'}>
                {context.countingState.map(e => e + 1).join(' - ')}&nbsp;
              </Typography>
              <Typography variant="h1" gutterBottom fontSize={'calc(min(5vw, 5vh))'}>
                {context.finalTranscript}&nbsp;
              </Typography>
              <Stack direction={'row'} justifyContent={'center'} gap={1} sx={{ margin: '0.5rem 0' }}>
                <button onClick={() => {
                  context.stopCounting();
                }}>Stop</button>
                <button onClick={() => {
                  context.resetCount();
                }}>Reset</button>
                <button onClick={() => {
                  if (context.waitTimer.paused) {
                    return context.continueCounting();
                  }
                  context.pauseCounting();
                }}>{context.waitTimer.paused ? 'Weiter' : 'Pause'} {context.waitTimer.paused}</button>
                <button onClick={() => {
                  context.addCountToState();
                }}>Eintragen</button>
              </Stack>
            </div>
          </div>
        }

        {
          context.export && <div className="export-overlay">
            <div className="export-overlay-content">
              <Typography variant="h1" gutterBottom>
                Export
              </Typography>
              <textarea value={context.export} readOnly onFocus={() => {
                // copy to clickboard
                navigator.clipboard.writeText(context.export);
              }}></textarea>
              <Stack direction={'row'} justifyContent={'center'} gap={1} sx={{ margin: '0.5rem 0' }}>
                <button onClick={() => {
                  context.export = '';
                }}>Schließen</button>
              </Stack>
            </div>
          </div>
        }
      </Paper>

      {context.error && <p className='errorArea'>{context.error}</p>}
    </>
  )
})

export default App
