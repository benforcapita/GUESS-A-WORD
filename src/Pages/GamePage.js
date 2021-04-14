import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { decrementLives } from '../actions';
import { increaseBadGuesses } from '../actions'
import './GamePage.css'

function GamePage() {
    const dispatch = useDispatch()

    const lives = useSelector(state => state.lives)
    const badGuesses = useSelector(state => state.badGuesses)
    const secrectWords = useSelector(state => state.secretWords);

    var bad_guesses = 0;
    var good_guesses = [];
    let secret_word = "";
    const [sw, setSw] = useState("")
    const [secret, setSecret] = useState("")
    var [goodGuesses, setGoodGuesses] = useState([]);
    const [guess, setGuess] = useState("")



    const getSecretWord = () => {
        let wordIndex = Math.floor(Math.random() * secrectWords.length);
        let secret_word = secrectWords[wordIndex]
        return secret_word;
    }


    const fillArrayDashes = (secret_word) => {

        for (var i = 0; i < secret_word.length; i++) {

            good_guesses.push("_");
        }
        setGoodGuesses(good_guesses);
        return (good_guesses)

    }

    const gameStart = (secret_word) => {

        var guess = document.getElementById("input").value
        setGuess("")
        good_guesses = goodGuesses;
        console.log(secret_word)




        if (secret_word.indexOf(guess) === -1) {
            bad_guesses++;
            dispatch(increaseBadGuesses())
            dispatch(decrementLives())
            console.log("Bad guess!");
            console.log(badGuesses)
            if (badGuesses === 2) {
                alert(`3 Bad guesses, you failed, the secret word was: ${secret_word}`)
                window.location.assign("gameover");
            }

        } else {
            for (var i = 0; i < secret_word.length; i++) {

                if (secret_word[i] === guess) {
                    good_guesses[i] = guess;
                }
            }
            console.log("good:" + good_guesses)
            setGoodGuesses(good_guesses);
            setSecret(good_guesses.join(" "));
        }
        console.log(secret_word, good_guesses)
        checkWin(secret_word, good_guesses);


    }

    const checkWin = (secret_word, good_guesses) => {
        if (good_guesses.includes("_")) {
            return
        } else {
            alert(`You WIN, The secret word was: ${secret_word}`)
            window.location.reload()
        }

    }


    const gameOn = () => {
        secret_word = getSecretWord();
        setSw(secret_word)
        good_guesses = fillArrayDashes(secret_word);
        let wordIndex1 = Math.floor((Math.random() * (secret_word.length - 1)));
        let wordIndex2 = Math.floor((Math.random() * (secret_word.length - 1)));

        good_guesses[wordIndex1] = secret_word.charAt(wordIndex1)
        good_guesses[wordIndex2] = secret_word.charAt(wordIndex2)
        setSecret(good_guesses.join(" "))
        // alert(secret_word)
    }

    useEffect(() => {

        gameOn();

    }, [])


    const handleGuessLetter = (e) => {
        setGuess(e.target.value);

    }

    return (
        <div className="GamePage">
            <div className="gameElements" >
                <input className="input" onKeyDown={(e) => {
                    if (e.key == "Enter") {
                        gameStart(sw)
                    }
                }} id="input" onChange={handleGuessLetter} value={guess} size="50" />
                <button id="checkBtn" onClick={() => {

                    gameStart(sw)
                }} >check the guess</button>
                <h1>{secret}</h1>
                <h1>{`Bad guesses: ${badGuesses}`}</h1>
                <h1>{`Lives Left: ${lives}`}</h1>
            </div>

        </div>
    )
}

export default GamePage
