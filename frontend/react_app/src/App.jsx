import './App.css' ;
import Header from './header.jsx';
import Home from './home.jsx';
import Analyse from './analyse.jsx';
const App = ()=> {
  return (
    <div className = 'container'>
      <Header />
      <Home />
      <Analyse/>
    </div>
  );
}
export default App ;