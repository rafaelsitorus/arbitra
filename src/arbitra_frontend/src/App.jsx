import { Routes, Route } from 'react-router-dom';
import Front from './pages/Front.jsx';
import Home from './pages/Home.jsx';
import Deals from './pages/Deals.jsx'
import Profile from './pages/Profile.jsx'
import AddDeal from './pages/AddDeal.jsx'
import { Container } from 'react-bootstrap';

function App() {
  return (
    <>
      <Container className="mb-4 min-vh-100">
        <Routes>
          <Route path="/" element={<Front />} />
          <Route path='/Home' element={<Home />}/>
          <Route path='/Deals' element={<Deals />}/>
          <Route path='/Profile' element={<Profile />}/>
          <Route path='/AddDeal' element={<AddDeal />}/>
        </Routes>
      </Container>
    </>
  );
}

export default App;