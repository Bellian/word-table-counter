import { useContext, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material'
import TableStoreContext from '../stores/table'

const SelectTable = observer(function () {
  const context = useContext(TableStoreContext);
  const loadForm = useRef<HTMLFormElement>();

  if (!context.table) {
    // show new table / load ui
    return <>
      {context.tables.length > 0 &&
        <Paper sx={{ padding: 2, margin: 2 }}>
          <form ref={loadForm as any} onSubmit={(ev) => {
            ev.preventDefault();
            const id = loadForm.current!['table'].value;
            context.loadTable(id);
          }}>
            <Typography variant="h4" gutterBottom>
              Liste Laden
            </Typography>

            <FormControl fullWidth sx={{ margin: '0.5rem 0' }}>
              <InputLabel id="demo-simple-select-label">Tabelle</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                label="Tabelle"
                name='table'
                defaultValue={context.tables?.[0]?.id}
              >
                {context.sortedTables.map((table) => {
                  return <MenuItem key={table.id} value={table.id}>{table.name}</MenuItem>
                })}
              </Select>
            </FormControl>

            <button type='submit'>laden</button>
          </form>
        </Paper>
      }
    </>
  }
  return <></>
})

export default SelectTable
