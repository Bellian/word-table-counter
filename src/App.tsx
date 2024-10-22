import { useContext } from 'react'
import './App.scss'
import { observer } from 'mobx-react-lite'
import TableStoreContext from './stores/table'
import { Paper, Stack, Typography } from '@mui/material'
import SelectTable from './components/selectTable'
import CreateTable from './components/createTable'
import WordTable from './components/wordTable'

const App = observer(function () {
  const context = useContext(TableStoreContext);

  if (!context.loaded) {
    return <></>
  }

  if (!context.table) {
    // show new table / load ui
    return <>
      <SelectTable></SelectTable>
      <CreateTable></CreateTable>
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
                {context.countingState.map(e => e+1).join(' - ')}&nbsp;
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
                  if(context.waitTimer.paused) {
                    return context.continueCounting();
                  }
                  context.pauseCounting();
                }}>{context.waitTimer.paused ? 'Weiter': 'Pause'} {context.waitTimer.paused}</button>
                <button onClick={() => {
                  context.addCountToState();
                }}>Eintragen</button>
              </Stack>
            </div>
          </div>
        }



      </Paper>

    </>
  )
})

export default App
