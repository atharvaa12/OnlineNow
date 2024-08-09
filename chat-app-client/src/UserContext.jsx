import axios from 'axios';
import {createContext, useEffect} from 'react';
import {useState} from 'react';
export const UserContext=createContext({});
export function UserContextProvider({children}){
    const [username,setUsername]=useState(null);
    const [id,setId]=useState(null);

    useEffect(()=>{
        async function getProfileStatus(){
            try{
            const {data}=await axios.get('/profile',{withCredentials:true});
            setId(data.userId);
            setUsername(data.username);
            }
            catch(e){
                console.log("no token");
            }
        }
        getProfileStatus();
    },[]);
    return (
        <UserContext.Provider value={{username,setUsername,id,setId}}>
            {children}
        </UserContext.Provider>
    );
}