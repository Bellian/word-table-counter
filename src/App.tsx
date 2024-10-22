import { useContext, useRef, useState } from 'react'
import './App.scss'
import { observer } from 'mobx-react-lite'
import TableStoreContext from './stores/table'
import { FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
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

          <button onClick={(event) => {
            context.loadTable(null);
          }}>Back</button>

          <Typography variant="h4" gutterBottom>
            {context.table.name}
          </Typography>
        </Stack>


        <Stack direction={'row'} justifyContent={'center'} gap={1} sx={{ margin: '0.5rem 0' }}>

          <button onClick={(event) => {
            if (context.recognizing) {
              return context.stopListener(event.nativeEvent);
            }
            context.startListener(event.nativeEvent);
          }}>{context.recognizing ? 'Stop' : 'Erkennung'}</button>


          <button onClick={(event) => {
            if (context.recognizing) {
              return context.stopListener(event.nativeEvent);
            }
            context.startListener(event.nativeEvent);
          }}>{context.recognizing ? 'Stop' : 'Vorzählen'}</button>
        </Stack>

        <p>{context.interimTranscript[0]}</p>
        <p>{context.interimTranscript[1]}</p>
        <p>{context.error}</p>

        <WordTable></WordTable>



      </Paper>

    </>
  )
})

export default App
