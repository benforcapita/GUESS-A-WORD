import './App.css';
import GameOverPage from './Pages/GameOverPage/GameOverPage';
import GamePage from './Pages/GamePage';
import IntroPage from './Pages/IntroPage/IntroPage';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
      
      <Switch>
    
     <Route path="/" exact component={IntroPage} />
     <Route path="/gamestart" exact component={GamePage} />
     <Route path="/gameover" exact component={GameOverPage} />

      </Switch>
    
  
     
    
    </div>
    </Router>
  );
}

export default App;
