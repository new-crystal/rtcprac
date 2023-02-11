import "./App.css";
import Meet from "./Meet_old";
import Stream from "./Stream";
import { database } from "./server/firebase";
import { push, ref, set } from "firebase/database";
import { useEffect } from "react";

function App() {
  return (
    <div className="App">
      {/* <Stream /> */}
      <Meet />
    </div>
  );
}

export default App;
