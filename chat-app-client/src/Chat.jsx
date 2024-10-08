import { useEffect, useRef } from "react";
import { useState } from "react";
import Avatar from "./Avatar";
import { useContext } from "react";
import { UserContext } from "./UserContext";
import axios from "axios";


export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const loggedInUserId = useContext(UserContext).id;
  
  const LoggedInUsername = useContext(UserContext).username;
  const setLoggedInUsername=useContext(UserContext).setUsername;
  const setLoggedInUserId=useContext(UserContext).setId;
  const [InputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [scrollInstantly, setScrollInstantly] = useState(false);
  const divUnderMessages = useRef(null);
 
  useEffect(() => {
    connectToWs();
    
  }, []);
  function connectToWs() {
    
    const socket = new WebSocket("ws://localhost:4000");
   
    console.log("hello ",LoggedInUsername);

    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", () => {
      console.log("ws closed");
      setTimeout(() => {
        connectToWs();
      }, 2000);
      
    });
    setWs(socket);
    
    
  
  }
  useEffect(() => {
    if (divUnderMessages.current && scrollInstantly === false) {
      console.log(messages);
      divUnderMessages.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);
  useEffect(() => {
    if (scrollInstantly === true) {
      if (divUnderMessages.current) {
        divUnderMessages.current.scrollIntoView({
          behavior: "instant",
          block: "end",
        });
        setScrollInstantly(false);
      }
    }
  }, [scrollInstantly]);

  useEffect(() => {
    if (selectedUserId) {
      axios
        .get("/messages/" + selectedUserId)
        .then((response) => {
          const messageHistory = response.data;
          const updatedMessages = messageHistory.map((message) => {
            if (message.sender === loggedInUserId) {
              return { receiver: selectedUserId, message: message.message };
            } else if (message.receiver === loggedInUserId) {
              return { sender: selectedUserId, message: message.message };
            }
            return null;
          });

          setScrollInstantly(true);
          setMessages(updatedMessages);
        })
        .catch((e) => {
          console.log(e);
          alert("error fetching data");
        });
    }
  }, [selectedUserId]);

  function showOnlinePeople(onlinePeopleArray) {
    const people = {};
    onlinePeopleArray.forEach((person) => {
      console.log("person is",person);
      if (person.userId != loggedInUserId)
        people[person.userId] = person.username;
    });
    console.log(onlinePeopleArray);
    setOnlinePeople(people);
  }
  function handleMessage(event) {
    const messageData = JSON.parse(event.data);
    //console.log(messageData);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    }
    if ("message" in messageData && "senderId" in messageData) {
      // console.log("message recieved", messageData);
      setMessages((m) => {
        const updatedMessages = [
          ...m,
          { sender: messageData.senderId, message: messageData.message },
        ];
        return updatedMessages;
      });
    }
  }
  function logout(){
      
      axios.post('logout').then(()=>{

        setLoggedInUsername(null);
        setLoggedInUserId(null);
        ws.close();
        console.log("disconnected");
       }); 
    
  }
  function selectContact(userId) {
    if (userId != selectedUserId) {
      console.log("selected user", userId);
    }
    setSelectedUserId(userId);
  }
  async function sendMessage(ev) {
    ev.preventDefault();
    if (InputMessage) {
      await ws.send(
        JSON.stringify({
          sender: loggedInUserId,
          receiver: selectedUserId,
          message: InputMessage,
        })
      );
      setMessages((m) => {
        const updatedMessages = [
          ...m,
          { receiver: selectedUserId, message: InputMessage },
        ];
        return updatedMessages;
      });
      setInputMessage("");
    }
  }
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <div className="bold text-blue-600 text-center pb-2 pt-2">Contacts</div>
        <div className="flex-grow">
          {Object.keys(onlinePeople).map((userId) => (
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
        <div className="p-2 text-center">
          
          <div className="bg-red-500 inline-block p-1.5 ">
            <button className="text-white rounded-sm " onClick={logout}>logout</button>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-indigo-50  w-2/3 p-2">
        <div className="flex-grow flex items-center justify-center">
          {selectedUserId ? "" : "Select a contact to start chatting"}
        </div>
        {!!selectedUserId && (
          <div className="relative h-full">
            <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
              {messages.map((message, index) => {
                if (
                  (message.sender && message.sender === selectedUserId) ||
                  (message.receiver && message.receiver === selectedUserId)
                ) {
                  return (
                    <div
                      key={index}
                      className={message.sender ? "text-left" : "text-right"}
                    >
                      <div
                        className={
                          "inline-block p-2 my-1 mr-1 rounded-md text-sm " +
                          (message.sender
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-500")
                        }
                      >
                        {message.message}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
              <div ref={divUnderMessages}></div>
            </div>
          </div>
        )}

        {selectedUserId && (
          <form className="flex gap-2 " onSubmit={sendMessage}>
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
          </form>
        )}
      </div>
    </div>
  );
}
