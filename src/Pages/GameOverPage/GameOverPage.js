import React from 'react'
import './GameOverPage.css'

function GameOverPage() {
    return (
        <div className="GameOverPage">
            <form className="form">
                <h1>GAME OVER!!</h1>
                <h4>Enter your name:</h4>
                <input
                    type="text"
                />
                <br/>
                <h4>Enter your Phone Number:</h4>
                <input
                    type="number"
                />
                <br/>
                <br/>
                <button>Submit</button>
            </form>
        </div>
    )
}

export default GameOverPage
