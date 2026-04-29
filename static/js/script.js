let chatSessions = [];
let currentChat = [];
let currentSessionIndex = null;

document.getElementById("new-chat-btn").addEventListener("click", () => {
    if (currentChat.length > 0) {
        const title = generateTitle(currentChat);
        const isDuplicate = chatSessions.some(session => {
            return session.title === title && isChatDuplicate(session.messages, currentChat);
        });

        if (currentSessionIndex !== null && !isDuplicate) {
            chatSessions[currentSessionIndex] = { title, messages: [...currentChat] };
        } else if (!isDuplicate) {
            chatSessions.push({ title, messages: [...currentChat] });
        }

        renderChatHistory();
    }

    clearChat();
    currentSessionIndex = null;
});

function sendMessage() {
    const userInput = document.getElementById("user-input");
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage(message, 'user-msg', true);
    currentChat.push({ role: 'user', text: message });
    userInput.value = "";

    fetch("/get", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg: message })
    })
    .then(res => res.json())
    .then(data => {
        data.forEach(h => {
            const formatted = `<div class='arabic'>${h.arabic}</div><br><div class='english'>${h.english}</div>`;
            appendMessage(formatted, 'bot-msg', false);
            currentChat.push({ role: 'bot', text: formatted });

            if (currentSessionIndex !== null) {
                const title = generateTitle(currentChat);
                chatSessions[currentSessionIndex] = { title, messages: [...currentChat] };
                renderChatHistory();
            }
        });
    });
}

function appendMessage(msg, className, isUser = true) {
    const chatBox = document.getElementById("chat-box");
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${className} ${isUser ? 'right' : 'left'}`;
    bubble.innerHTML = msg;
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function clearChat() {
    document.getElementById("chat-box").innerHTML = "";
    currentChat = [];
}

function renderChatHistory() {
    const list = document.getElementById("chat-history");
    list.innerHTML = "";
    chatSessions.forEach((session, index) => {
        const li = document.createElement("li");
        li.innerText = session.title;
        li.className = "chat-title";
        li.onclick = () => loadChat(index);
        list.appendChild(li);
    });
}

function loadChat(index) {
    if (currentChat.length > 0) {
        const title = generateTitle(currentChat);
        const isDuplicate = chatSessions.some(session => {
            return session.title === title && isChatDuplicate(session.messages, currentChat);
        });

        if (!isDuplicate) {
            if (currentSessionIndex === null || currentSessionIndex === undefined || !chatSessions[currentSessionIndex]) {
                chatSessions.push({ title, messages: [...currentChat] });
            } else {
                chatSessions[currentSessionIndex] = { title, messages: [...currentChat] };
            }

            renderChatHistory();
        }
    }

    clearChat();
    currentChat = [...chatSessions[index].messages];
    currentSessionIndex = index;

    currentChat.forEach(msg => {
        appendMessage(msg.text, msg.role === 'user' ? 'user-msg' : 'bot-msg', msg.role === 'user');
    });
}


function generateTitle(chat) {
    let title = 'Untitled';

    for (let i = 0; i < chat.length; i++) {
        let isUnique = true;
        for (let session of chatSessions) {
            if (session.messages[i] && chat[i] && session.messages[i].text === chat[i].text) {
                isUnique = false;
            } else {
                isUnique = true;
                break;
            }
        }

        if (isUnique && chat[i]) {
            const snippet = chat[i].text.slice(0, 20);
            title = snippet + '...';
            break;
        }
    }

    return title;
}


function isChatDuplicate(existingMessages, newMessages) {
    if (existingMessages.length !== newMessages.length) return false;

    for (let i = 0; i < newMessages.length; i++) {
        if (existingMessages[i].text !== newMessages[i].text) {
            return false;
        }
    }

    return true;
}


function showDeletePopup(index) {
    const popup = document.createElement("div");
    popup.className = "delete-popup";

    popup.innerHTML = `
        <div class="popup-content">
            <p>Are you sure you want to delete this chat?</p>
            <div class="popup-buttons">
                <button class="popup-no">No</button>
                <button class="popup-yes">Yes</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector(".popup-no").onclick = () => popup.remove();

    popup.querySelector(".popup-yes").onclick = () => {
        chatSessions.splice(index, 1);
        renderChatHistory();
        clearChat();
        popup.remove();
    };
}

function renderChatHistory() {
    const list = document.getElementById("chat-history");
    list.innerHTML = "";
    chatSessions.forEach((session, index) => {
        const li = document.createElement("li");
        const titleSpan = document.createElement("span");
        titleSpan.innerText = session.title;
        titleSpan.className = "chat-title";
        li.appendChild(titleSpan);

        const dotMenu = document.createElement("div");
        dotMenu.className = "chat-dots";
        dotMenu.innerHTML = "⋯";
        dotMenu.onclick = (e) => {
            e.stopPropagation();
            showDeletePopup(index);
        };
        li.appendChild(dotMenu);

        li.onclick = () => loadChat(index);
        list.appendChild(li);
    });
}

