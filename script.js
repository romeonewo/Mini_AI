 const API_KEY = "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"; // 🔐 Replace with your actual API key
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const messagesContainer = document.getElementById("messagesContainer");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const exampleQuestions = document.querySelectorAll(".example-question");
  const history = document.getElementById("history");
  const newChatBtn = document.querySelector(".new-chat-btn");

  let chatHistory = [
    {
      role: "system",
      content: "You are MIni AI, an advanced assistant with a futuristic personality. Be helpful, friendly, and insightful."
    }
  ];

  let chatHistories = {};
  let currentChatId = null;
  
  // Auto-resize textarea
  input.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
    if (this.scrollHeight > 200) {
      this.style.overflowY = "auto";
    } else {
      this.style.overflowY = "hidden";
    }
  });

  // Create a new chat session
  function createNewChat() {
    welcomeScreen.style.display = "flex";
    messagesContainer.style.display = "none";
    messagesContainer.innerHTML = "";
    
    const chatId = "chat_" + Date.now();
    currentChatId = chatId;
    
    chatHistories[chatId] = [
      {
        role: "system",
        content: "You are MIni AI, an advanced assistant with a futuristic personality. Be helpful, friendly, and insightful."
      }
    ];
    
    chatHistory = chatHistories[chatId];
    
    // Add to sidebar
    addChatToHistory(chatId, "New conversation");
    
    // On mobile, close sidebar after selecting
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("active");
    }
  }

  // Add chat to history sidebar
  function addChatToHistory(chatId, title) {
    const historyItem = document.createElement("div");
    historyItem.classList.add("history-item");
    historyItem.dataset.chatId = chatId;
    historyItem.textContent = title;
    
    historyItem.addEventListener("click", () => {
      loadChat(chatId);
    });
    
    // Add at the top
    if (history.firstChild) {
      history.insertBefore(historyItem, history.firstChild);
    } else {
      history.appendChild(historyItem);
    }
  }

  // Load a chat from history
  function loadChat(chatId) {
    if (!chatHistories[chatId]) return;
    
    currentChatId = chatId;
    chatHistory = chatHistories[chatId];
    
    // Display messages
    messagesContainer.innerHTML = "";
    welcomeScreen.style.display = "none";
    messagesContainer.style.display = "block";
    
    // Rebuild messages UI from history
    let lastRole = null;
    for (let i = 1; i < chatHistory.length; i++) { // Skip system message
      const msg = chatHistory[i];
      if (msg.role === lastRole) continue; // Skip if same role (just for UI)
      
      addMessageToUI(msg.content, msg.role);
      lastRole = msg.role;
    }
    
    // On mobile, close sidebar after selecting
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("active");
    }
  }

  // Add a message to the UI
  function addMessageToUI(content, sender) {
    // Hide welcome screen, show messages
    welcomeScreen.style.display = "none";
    messagesContainer.style.display = "block";
    
    const messageGroup = document.createElement("div");
    messageGroup.classList.add("message-group");
    
    const messageHeader = document.createElement("div");
    messageHeader.classList.add("message-header");
    
    const icon = document.createElement("div");
    icon.classList.add("icon");
    
    const name = document.createElement("div");
    
    if (sender === "user") {
      icon.classList.add("user-icon");
      icon.textContent = "U";
      name.textContent = "You";
    } else {
      icon.classList.add("bot-icon");
      icon.textContent = "M";
      name.textContent = "MIni AI";
    }
    
    messageHeader.appendChild(icon);
    messageHeader.appendChild(name);
    
    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");
    messageContent.classList.add(sender === "user" ? "user-content" : "bot-content");
    messageContent.innerHTML = marked.parse(content);
    
    messageGroup.appendChild(messageHeader);
    messageGroup.appendChild(messageContent);
    
    messagesContainer.appendChild(messageGroup);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Update sidebar history label with first user message
    if (sender === "user" && chatHistory.filter(msg => msg.role === "user").length === 1) {
      const historyItems = document.querySelectorAll(".history-item");
      historyItems.forEach(item => {
        if (item.dataset.chatId === currentChatId) {
          // Truncate if too long
          item.textContent = content.length > 30 ? content.substring(0, 30) + "..." : content;
        }
      });
    }
  }

  // Show typing indicator
  function showTypingIndicator() {
    const typingIndicator = document.createElement("div");
    typingIndicator.classList.add("typing-indicator");
    typingIndicator.id = "typingIndicator";
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      typingIndicator.appendChild(dot);
    }
    
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const typingIndicator = document.getElementById("typingIndicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Send message function
  async function sendMessage() {
    const userText = input.value.trim();
    if (!userText) return;
    
    // Create new chat if this is first message
    if (!currentChatId) {
      createNewChat();
    }
    
    addMessageToUI(userText, "user");
    chatHistory.push({ role: "user", content: userText });
    input.value = "";
    input.style.height = "auto";
    
    // Show typing indicator
    showTypingIndicator();

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3-0324:free",
          messages: chatHistory,
        }),
      });

      const data = await response.json();
      
      // Remove typing indicator
      removeTypingIndicator();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const reply = data.choices[0].message.content;
        addMessageToUI(reply, "assistant");
        chatHistory.push({ role: "assistant", content: reply });
      } else {
        addMessageToUI("I'm having trouble connecting. Please try again.", "assistant");
      }

    } catch (err) {
      removeTypingIndicator();
      addMessageToUI("⚠️ Connection failed. Please check your internet connection and try again.", "assistant");
    }
  }

  // Event listeners
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);

  menuToggle.addEventListener("click", function() {
    sidebar.classList.toggle("active");
  });

  // Example questions click
  exampleQuestions.forEach(question => {
    question.addEventListener("click", function() {
      input.value = this.textContent;
      input.dispatchEvent(new Event('input')); // Trigger resize
      sendMessage();
    });
  });

  // New chat button
  newChatBtn.addEventListener("click", createNewChat);
  
  // Initialize first chat
  createNewChat();
