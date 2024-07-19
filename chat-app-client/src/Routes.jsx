import Register from "./Register";
import { UserContext } from "./UserContext";
import { useContext } from "react";
export default function Routes(){
    const {username,id}=useContext(UserContext);
    if(username){
        return <h1>logged in</h1>;
    }
    return (
        <Register/>

    );
}