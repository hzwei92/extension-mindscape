import { useDispatch, useSelector, shallowEqual } from "react-redux"

import { CounterState, decrement, increment } from "~features/counter/counterSlice"
import { RootState, useAppDispatch, useAppSelector } from "~store"

export const CounterView = () => {
  const dispatch = useAppDispatch()
  const value = useAppSelector((state: RootState) => state.counter.count)
  console.log('render counter', value)
  return (
    <div>
      <div>Current count: {value}</div>
      <button onClick={() => dispatch(increment())}>Increment counter</button>
      <button onClick={() => dispatch(decrement())}>Decrement counter</button>
    </div>
  )
}
