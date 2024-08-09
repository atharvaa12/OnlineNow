import { useEffect, useRef } from "react";
import { useState } from "react";
import Avatar from "./Avatar";
import { useContext } from "react";
import { UserContext } from "./UserContext";
export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const loggedInUserId = useContext(UserContext).id;
  const [InputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const divUnderMessages = useRef(null);
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:4000");
    // socket.addEventListener("open", () => {
    //     console.log("connected to server");
    // });

    socket.addEventListener("message", handleMessage);
    setWs(socket);
    return () => {
      socket.close();
    };
  }, []);
  useEffect(() => {
    console.log(messages);
  }, [messages]);
  useEffect(() => {
    if (divUnderMessages.current) {
      divUnderMessages.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  function showOnlinePeople(onlinePeopleArray) {
    const people = {};
    onlinePeopleArray.forEach((person) => {
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
      console.log("message recieved", messageData);
      setMessages((m) => {
        const updatedMessages = [
          ...m,
          { sender: messageData.senderId, message: messageData.message },
        ];
        return updatedMessages;
      });
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
      <div className="bg-white w-1/3">
        <div className="bold text-blue-600 text-center pb-2 pt-2">Contacts</div>

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
