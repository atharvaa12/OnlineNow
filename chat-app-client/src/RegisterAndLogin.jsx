import {useState, useContext} from 'react';
import axios from 'axios';
import {UserContext} from './UserContext';
export default function RegisterAndLogin() {
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {setUsername:setLoggedInUsername,setId}=useContext(UserContext);
  const [loginOrRegister, setLoginOrRegister] = useState('Register');
  async function submit(ev){
    ev.preventDefault();
    if(loginOrRegister==="Register"){
      try{
   const {data}= await axios.post('/register',{username,password});
    setLoggedInUsername(username);
     setId(data.id);
      }
      catch(e){
        alert("username already exists");
      
      }
    }
    else{
      try{
      const response=await axios.post('/login',{username,password});

      if(response.status===200){
        setLoggedInUsername(username);
        setId(response.data.id);
      
      }
      
    }
    catch(e){
        console.log(e);
        alert("incorrect username or password");
      
    }
    }
  }
  return (
    <div className="bg-blue-50 h-screen flex items-center" >
        <form className="w-64 mx-auto" onSubmit={submit}>
            <input type="text" placeholder="username" className="block rounded-sm p-2 mb-2 border w-full" onChange={ev=>setUsername(ev.target.value)} value={username}/>
            <input type="password" placeholder="password" className="block rounded-sm p-2 mb-2 border w-full" onChange={ev=>setPassword(ev.target.value)} value={password}/>
            
            <button className="bg-blue-500 text-white block w-full rounded-sm p-2">{loginOrRegister}</button>
            <div className='text-center mt-2'>
            {
              loginOrRegister==="Register" && (
                
              <div className=''>Already have an account? <button className="text-blue-500" onClick={()=>setLoginOrRegister("Login")}>Login</button></div>)
             
            }
            {
              loginOrRegister==="Login" && (
                
              <div className=''>Don't have an account? <button className="text-blue-500" onClick={()=>setLoginOrRegister("Register")}>Register</button></div>)
            }
            </div>
          
        </form>
    </div>
  )
}