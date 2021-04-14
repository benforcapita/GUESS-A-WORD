import { combineReducers } from "redux"
import badGuessesReducer from "./badGuesses"
import livesReducer from "./lives"
import secretWordsReducer from "./secretWords"

const allReducers= combineReducers({
    badGuesses: badGuessesReducer,
    lives: livesReducer,
    secretWords: secretWordsReducer
})

export default allReducers;