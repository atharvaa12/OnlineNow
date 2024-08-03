import { useEffect, useRef } from "react";
import { useState } from "react";
import Avatar from "./Avatar";
import { useContext } from "react";
import { UserContext } from "./UserContext";
export default function Chat() {
  const [ws,setWs]=useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const loggedInUserId = useContext(UserContext).id;
  const [InputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:4000");
    // socket.addEventListener("open", () => {
    //     console.log("connected to server");
    // });
   
    socket.addEventListener("message", handleMessage);
    setWs(socket);
    return ()=>{
      if(ws){
        ws.close();
        setWs(null);
      }
    }
  }, []);
  function showOnlinePeople(onlinePeopleArray) {
    const people = {};
    onlinePeopleArray.forEach((person) => {
      if (person.userId != loggedInUserId)
        people[person.userId] = person.username;
    });

    setOnlinePeople(people);
  }
  function handleMessage(event) {
    const messageData = JSON.parse(event.data);
    //console.log(messageData);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    }
    if("message" in messageData && "senderId" in messageData){
        console.log("message recieved",messageData);
        //setMessages([...messages,{sender:messageData.senderId,message:messageData.message}]);
        
    }
  }
  function selectContact(userId) {
    if (userId != selectedUserId) {
      console.log("selected user", userId);
    }
    setSelectedUserId(userId);
  }
  function sendMessage(ev) {
    ev.preventDefault();
    if (InputMessage) {
      ws.send(
        JSON.stringify({
            sender: loggedInUserId,
          reciever: selectedUserId,
          message: InputMessage,
        })
      );
      setInputMessage("");
      //setMessages([...messages,{sender:loggedInUserId,message:InputMessage}]);
    }
  }
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <div className="bold text-blue-600 text-center pb-2 pt-2">Contacts</div>
        
          { Object.keys(onlinePeople).map((userId) => (
          <div
            key={userId}
            onClick={() => selectContact(userId)}
            className={
              " flex gap-2 border-b border-gray-100 py-2 pl-2 cursor-pointer " +
              (userId === selectedUserId ? "bg-blue-100" : "")
            }
          >
            <Avatar username={onlinePeople[userId]} />
            <span className="pt-0.5">{onlinePeople[userId]}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-indigo-50  w-2/3 p-2">
        
          <div className="flex-grow flex items-center justify-center">
            {selectedUserId ? (""):("Select a contact to start chatting")}
          </div>
        
        
        { selectedUserId &&
        (<form className="flex gap-2 " onSubmit={sendMessage}>
          <input
            type="text"
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type here"
            value={InputMessage}
            className="flex-grow rounded-sm bg-white border p-2"
          />
          <button
            type="submit"
            className="bg-blue-700 p-2 text-white block rounded-sm"
          >
            Send
          </button>
        </form>)
        }
      </div>
    </div>
  );
}
