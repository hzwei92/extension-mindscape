import { createSlice } from "@reduxjs/toolkit"

export interface CounterState {
  count: number
}

const counterSlice = createSlice({
  name: "counter",
  initialState: { count: 0 },
  reducers: {
    increment: (state) => {
      state.count += 2
    },
    decrement: (state) => {
      state.count -= 2
    }
  }
})

export const { increment, decrement } = counterSlice.actions

export default counterSlice.reducer
