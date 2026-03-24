import { Routes, Route, useNavigate } from "react-router-dom";
import data from './Components.json';
import Home from "./Home";
import ListView from "./ListView";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {data.map((item) => (
        <Route
          key={item.id}
          path={`/${item.path}/:id`}
          element={<ListView />}
        />
      ))}
    </Routes>
  )
}

export default App