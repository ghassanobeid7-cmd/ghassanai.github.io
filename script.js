const API_KEY = "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";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are an AI version of Ghassan Obeid, IT student at LIU (Lebanese International University), Year 2.

Facts about Ghassan:
- Passionate about Blockchain, Web3, and cryptocurrency
- Completed Python basics (currently paused)
- Builds and manages websites professionally using AI tools
- Currently learning Web3 and Blockchain development
- Open to freelance projects related to websites and Web3

Contact info:
- WhatsApp: +961-71094407
- Gmail: ghassanobeid7@gmail.com
- Telegram: t.me/GHA_SS_AN

STRICT RULES:
1. ONLY answer questions about Ghassan's skills, journey, experience, services, or contact info.
2. If asked about ANYTHING else reply: "I'm only here to talk about Ghassan and his work. How can I help you with that?"
3. NEVER make up information about Ghassan.
4. Detect visitor language and ALWAYS reply in same language.
5. Tone: professional and formal.`;

let userMessageCount = 0;
let isSending = false;

function hasArabic(text) {
  return /[\u0600-\u06FF]/.test(text || "");
}

function getLocalFallbackReply(userText) {
  const text = (userText || "").toLowerCase();
  const isArabic = hasArabic(userText);

  if (text.includes("من هو") || text.includes("who is") || text.includes("ghassan")) {
    return isArabic
      ? "غسان عبيد طالب تقنية معلومات سنة ثانية في LIU، مهتم بـ Web3 والبلوكتشين، ويعمل على بناء وإدارة مواقع باستخدام أدوات الذكاء الاصطناعي."
      : "Ghassan Obeid is a Year 2 IT student at LIU, passionate about Web3 and blockchain, and professionally builds and manages websites using AI tools.";
  }

  if (text.includes("مهارات") || text.includes("skills") || text.includes("python")) {
    return isArabic
      ? "مهارات غسان تشمل أساسيات Python (حالياً متوقف)، تطوير مواقع مدعوم بالذكاء الاصطناعي، والتعلم المستمر في Web3 والبلوكتشين."
      : "Ghassan's skills include Python fundamentals (currently paused), AI-powered web development, and active learning in Web3 and blockchain development.";
  }

  if (text.includes("web3") || text.includes("blockchain")) {
    return isArabic
      ? "غسان يركز حالياً على تعلم برمجة Web3 والعقود الذكية كخطوة نحو بناء DApps بشكل احترافي."
      : "Ghassan is currently focused on Web3 programming and smart contracts as the next step toward building professional DApps.";
  }

  if (text.includes("تواصل") || text.includes("contact") || text.includes("whatsapp") || text.includes("gmail") || text.includes("telegram")) {
    return isArabic
      ? "للتواصل: واتساب +961-71094407، البريد ghassanobeid7@gmail.com، تيليجرام t.me/GHA_SS_AN"
      : "Contact: WhatsApp +961-71094407, Gmail ghassanobeid7@gmail.com, Telegram t.me/GHA_SS_AN";
  }

  return isArabic
    ? "أنا هنا فقط للحديث عن غسان وخدماته. كيف يمكنني مساعدتك بخصوص ذلك؟"
    : "I'm only here to talk about Ghassan and his work. How can I help you with that?";
}

function createMessage(text, type) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) {
    return;
  }

  const bubble = document.createElement("div");
  bubble.className = `message ${type}`;
  bubble.textContent = text;
  bubble.dir = hasArabic(text) ? "rtl" : "ltr";
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setTyping(isTyping) {
  const typingIndicator = document.getElementById("typingIndicator");
  if (!typingIndicator) {
    return;
  }
  typingIndicator.classList.toggle("hidden", !isTyping);
}

function maybeShowCta() {
  const ctaCard = document.getElementById("ctaCard");
  if (!ctaCard) {
    return;
  }
  if (userMessageCount >= 3) {
    ctaCard.classList.remove("hidden");
  }
}

function setSuggestionsDisabled(disabled) {
  const suggestions = document.getElementById("suggestions");
  if (!suggestions) {
    return;
  }

  suggestions.querySelectorAll(".suggestion-btn").forEach((button) => {
    button.disabled = disabled;
    button.setAttribute("aria-disabled", String(disabled));
  });
}

function extractGroqText(data) {
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text === "string" && text.trim()) {
    return text.trim();
  }
  return "";
}

async function callGroq(userMessage) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const reason = errorData?.error?.status || "REQUEST_FAILED";
      const message = errorData?.error?.message || `Groq API error: ${response.status}`;
      throw new Error(`${reason}: ${message}`);
    }

    const data = await response.json();
    const aiText = extractGroqText(data);

    if (!aiText) {
      throw new Error("No content returned by Groq.");
    }

    return aiText;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendToAI(userText) {
  if (isSending) {
    return;
  }

  isSending = true;
  setSuggestionsDisabled(true);
  createMessage(userText, "user");
  userMessageCount += 1;
  maybeShowCta();
  setTyping(true);

  try {
    const aiText = await callGroq(userText);
    createMessage(aiText, "bot");
  } catch (error) {
    const raw = error?.message || "Unknown Groq error";
    const details = raw.toLowerCase();
    const isArabic = hasArabic(userText || "");

    let userFriendly = isArabic
      ? "تعذر الوصول إلى خدمة Groq الآن."
      : "I could not reach the AI service right now.";

    if (details.includes("api key") || details.includes("permission") || details.includes("referer") || details.includes("api_key") || details.includes("forbidden")) {
      userFriendly = isArabic
        ? "مشكلة في مفتاح Groq أو الصلاحيات. تأكد أن المفتاح صحيح ونشط."
        : "Groq key/config issue. Check API key validity and project permissions.";
    } else if (details.includes("quota") || details.includes("resource_exhausted") || details.includes("429")) {
      userFriendly = isArabic
        ? "تم الوصول لحد الاستخدام المجاني (Quota). حاول لاحقاً أو استخدم مفتاحاً آخر."
        : "Free-tier quota reached. Please try again later or use another key.";
    } else if (details.includes("timeout") || details.includes("abort")) {
      userFriendly = isArabic
        ? "انتهت مهلة الاتصال بخدمة Groq. تحقق من الإنترنت ثم أعد المحاولة."
        : "Groq request timed out. Check your connection and try again.";
    }

    createMessage(userFriendly, "bot");
    createMessage((isArabic ? "رد احتياطي: " : "Fallback reply: ") + getLocalFallbackReply(userText), "bot");
    console.error(error);
  } finally {
    setTyping(false);
    isSending = false;
    setSuggestionsDisabled(false);
  }
}

function setupSuggestions() {
  const suggestions = document.getElementById("suggestions");
  if (!suggestions) {
    return;
  }

  suggestions.querySelectorAll(".suggestion-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const message = button.dataset.message;
      if (message) {
        sendToAI(message);
      }
    });
  });
}

function setupRoadmapModal() {
  const nodeModal = document.getElementById("nodeModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalStatus = document.getElementById("modalStatus");
  const modalDetail = document.getElementById("modalDetail");
  const modalClose = document.getElementById("modalClose");

  if (!nodeModal || !modalTitle || !modalStatus || !modalDetail || !modalClose) {
    return;
  }

  document.querySelectorAll(".roadmap-node").forEach((node) => {
    node.addEventListener("click", () => {
      modalTitle.textContent = node.dataset.title || "Journey Node";
      modalStatus.textContent = node.dataset.status || "";
      modalDetail.textContent = node.dataset.detail || "";
      nodeModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    });
  });

  function closeModal() {
    nodeModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  modalClose.addEventListener("click", closeModal);

  nodeModal.addEventListener("click", (event) => {
    if (event.target === nodeModal) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !nodeModal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

function setupFadeIn() {
  const nodes = document.querySelectorAll(".fade-in");
  if (!nodes.length) {
    return;
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    nodes.forEach((node) => observer.observe(node));
  } else {
    nodes.forEach((node) => node.classList.add("visible"));
  }
}

function setupThemeToggle() {
  const toggle = document.querySelector(".theme-toggle");
  if (!toggle) {
    return;
  }

  const icon = toggle.querySelector(".theme-toggle-icon");
  const label = toggle.querySelector(".theme-toggle-text");

  const applyTheme = (theme) => {
    document.body.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("theme", theme);
    toggle.setAttribute("aria-pressed", String(theme === "light"));
    toggle.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");

    if (icon) {
      icon.textContent = theme === "light" ? "☀" : "☾";
    }

    if (label) {
      label.textContent = theme === "light" ? "Light" : "Dark";
    }
  };

  const savedTheme = localStorage.getItem("theme");
  applyTheme(savedTheme === "light" ? "light" : "dark");

  toggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
  });
}

function initChat() {
  if (!document.getElementById("chatMessages")) {
    return;
  }

  createMessage("Hello, I am Ghassan's AI assistant. Ask me anything about Ghassan's work and Web3 journey.", "bot");
}

setupSuggestions();
setupRoadmapModal();
setupThemeToggle();
setupFadeIn();
initChat();
