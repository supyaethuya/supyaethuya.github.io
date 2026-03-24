import { useNavigate } from "react-router-dom";
import data from './Components.json';
import logo1 from './assets/Logo1.png';
import consonant from './assets/Consonants.png';
import HomeBackground from './HomeBackground';
import vowel from './assets/Vowels.png';
import numeral from './assets/Numerals.png';
import './App.css';

function Home() {
  const navigate = useNavigate()

  return (
    <>
      <HomeBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div>
            <img src={logo1} className="logo" alt="Logo1" data-rock/>
        </div>
        <div className="card" style={{pointerEvents: "none", padding: "0", margin: "0"}} data-rock>
            <h1>Welcome to ကခဂဃင</h1>
            <p>This app aims to provide the art of writing Burmese Consonants</p>
            <p>Will futher improve the app for the language learners, who are interested in Burmese.</p>
        </div>
        <br></br>
        {data.map((item, index) => (
            <div className="card" key={index} data-rock>
            <button onClick={() => navigate(`${item.path}/${item.id}`)}>
                <img src={item.title == "Consonants" ? consonant : item.title == "Vowels" ? vowel : numeral} className="logo" alt={item.title} />
                <b>{item.title}</b>
            </button>
            </div>
        ))}
        <br></br>
        <small>Copyright @ SPTY&APK</small>
      </div>
    </>
  )
}

export default Home
