import { useContext, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material'
import TableStoreContext from '../stores/table'

const CreateTable = observer(function () {
  const context = useContext(TableStoreContext);
  const createForm = useRef<HTMLFormElement>();

  if (!context.table) {
    // show new table / load ui
    return <>
      <Paper sx={{ padding: 2, margin: 2 }}>
        <form ref={createForm as any} onSubmit={(ev) => {
          ev.preventDefault();

          context.createTable(
            createForm.current!['tableName'].value,
            createForm.current!['voice'].value,
            +createForm.current!['seiten'].value,
            +createForm.current!['spalten'].value,
            +createForm.current!['zeilen'].value
          );
        }}>
          <Typography variant="h4" gutterBottom>
            Neue Liste
          </Typography>
          <FormControl fullWidth sx={{ margin: '0.5rem 0' }}>
            <TextField
              name='tableName'
              label="Name"
              id="filled-hidden-label-small"
              placeholder='Name'
              variant="outlined"
              size="small"
              type='text'
              fullWidth
            />
          </FormControl>

          <FormControl fullWidth sx={{ margin: '0.5rem 0' }}>
            <InputLabel id="demo-simple-select-label">Stimme</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              label="Stimme"
              name='voice'
              defaultValue={context.voices?.[0]?.name}
              onChange={(ev) => {
                console.log(createForm.current)
                const text = createForm.current!['tableName'].value || 'Name';
                console.log(text);
                context.speak(text, ev.target.value! as string);
              }}
            >
              {context.voices.map((voice) => {
                return <MenuItem key={voice.voiceURI} value={voice.name}>{voice.name}</MenuItem>
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ margin: '0.5rem 0' }}>
            <TextField
              name='seiten'
              label="Seiten"
              id="filled-hidden-label-small"
              defaultValue="1"
              variant="outlined"
              size="small"
              type='number'
              inputProps={{ min: "1", max: "1000", step: "1" }}
              fullWidth
            />
          </FormControl>
          <FormControl fullWidth sx={{ margin: '0.5rem 0' }}>
            <TextField
              name='spalten'
              label="Spalten"
              id="filled-hidden-label-small"
              defaultValue="10"
              variant="outlined"
              size="small"
              type='number'
              inputProps={{ min: "1", max: "1000", step: "1" }}
              fullWidth
            />
          </FormControl>
          <FormControl fullWidth sx={{ margin: '0.5rem 0' }}>
            <TextField
              name='zeilen'
              label="Zeilen"
              id="filled-hidden-label-small"
              defaultValue="10"
              variant="outlined"
              size="small"
              type='number'
              inputProps={{ min: "1", max: "1000", step: "1" }}
              fullWidth
            />
          </FormControl>

          <button type='submit'>Erstellen</button>
        </form>
      </Paper>
    </>
  }
  return <></>
})

export default CreateTable
