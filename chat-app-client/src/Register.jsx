import {useState, useContext} from 'react';
import axios from 'axios';
import {UserContext} from './UserContext';
export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {setUsername:setLoggedInUsername,setId}=useContext(UserContext);
  async function submitRegistration(ev){
    ev.preventDefault();
   const {data}= await axios.post('/register',{username,password});
    setLoggedInUsername(username);
     setId(data.id);
  }
  return (
    <div className="bg-blue-50 h-screen flex items-center" >
        <form className="w-64 mx-auto" onSubmit={submitRegistration}>
            <input type="text" placeholder="username" className="block rounded-sm p-2 mb-2 border w-full" onChange={ev=>setUsername(ev.target.value)} value={username}/>
            <input type="password" placeholder="password" className="block rounded-sm p-2 mb-2 border w-full" onChange={ev=>setPassword(ev.target.value)} value={password}/>
            <button className="bg-blue-500 text-white block w-full rounded-sm p-2">Register</button>
        </form>
    </div>
  )
}