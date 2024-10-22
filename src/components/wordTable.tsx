import { useContext, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { FormControl, Input, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material'
import TableStoreContext from '../stores/table'
import { Stack } from '@mui/system'

const WordTable = observer(function () {
  const context = useContext(TableStoreContext);
  return <>

    <Stack direction={'row'} justifyContent={'space-between'}>
      {context.hasPrevPage && <button onClick={() => { context.setPage(context.currentPage - 1) }}>&lt;</button>}
      {!context.hasPrevPage && <button disabled>&lt;</button>}
      <Typography variant="h6" gutterBottom>
        Seite: {context.currentPage + 1}
      </Typography>
      {context.hasNextPage && <button onClick={() => { context.setPage(context.currentPage + 1) }}>&gt;</button>}
      {!context.hasNextPage && <button disabled>&gt;</button>}
    </Stack>

    <div className='word-table-wrapper'>
      <div className='word-table'>
        {context.table!.data[context.currentPage].map((_, i) => {
          return <div key={`line-${i}`}>
            {context.table!.data[context.currentPage][i].map((_, j) => {
              return <WordContainer line={i} element={j} key={`element-${i}-${j}`} />
            })}
          </div>
        })}
      </div>
    </div>
  </>
})

interface IWordContainerProp {
  line: number;
  element: number;
}

const WordContainer = observer(function ({ element, line }: IWordContainerProp) {
  const context = useContext(TableStoreContext);
  const word = context.table?.data[context.currentPage][line][element];
  const [pressed, setPressed] = useState(false);
  const ref = useRef<HTMLFormElement>();
  const perform = () => {
    const val = ref.current?.['wordInput'].value || '';
    context.setWord(val, line, element);
    setPressed(false);
  }
  return <form ref={ref as any} onClick={() => { setPressed(true) }} onSubmit={(ev) => {
    ev.preventDefault();
    perform();
  }}>
    <div className="element-id">{context.currentPage + 1} - {line + 1} - {element + 1}</div>
    {!pressed && (word || '---')}
    {pressed && <Input size='small' name="wordInput" defaultValue={word} autoFocus onBlur={() => {
      perform();
    }}></Input>}
  </form>
})


export default WordTable
