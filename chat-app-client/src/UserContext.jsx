import axios from 'axios';
import {createContext, useEffect} from 'react';
import {useState} from 'react';
export const UserContext=createContext({});
export function UserContextProvider({children}){
    const [username,setUsername]=useState(null);
    const [id,setId]=useState(null);

    useEffect(()=>{
        async function getProfileStatus(){
            const {data}=await axios.get('/profile',{withCredentials:true});
            console.log(data);
            console.log("hello");
        }
        getProfileStatus();
    },[]);
    return (
        <UserContext.Provider value={{username,setUsername,id,setId}}>
            {children}
        </UserContext.Provider>
    );
}