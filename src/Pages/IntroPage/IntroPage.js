import React from 'react'
import { Link } from 'react-router-dom';
import './IntroPage.css';

function IntroPage() {
    return (
        <div className="IntroPage">
            <Link to="/gamestart" >
            <button id="startGame" >Start New Game</button>
            </Link>
        </div>
    )
}

export default IntroPage
