import { Routes, Route } from 'react-router-dom';
import Home   from './pages/Home.jsx';
import Detail from './pages/Detail.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/"               element={<Home />} />
      <Route path="/contests/:id"   element={<Detail />} />
    </Routes>
  );
}
