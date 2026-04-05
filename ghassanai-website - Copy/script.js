const API_KEY = "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";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
let activeModel = GROQ_MODEL;

function getLocalFallbackReply(userText) {
  const text = (userText || "").toLowerCase();
  const isArabic = /[\u0600-\u06FF]/.test(userText || "");

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

const chatMessages = document.getElementById("chatMessages");
const typingIndicator = document.getElementById("typingIndicator");
const suggestions = document.getElementById("suggestions");
const ctaCard = document.getElementById("ctaCard");

const nodeModal = document.getElementById("nodeModal");
const modalTitle = document.getElementById("modalTitle");
const modalStatus = document.getElementById("modalStatus");
const modalDetail = document.getElementById("modalDetail");
const modalClose = document.getElementById("modalClose");

let userMessageCount = 0;
let isSending = false;

function hasArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function createMessage(text, type) {
  const bubble = document.createElement("div");
  bubble.className = `message ${type}`;
  bubble.textContent = text;
  bubble.dir = hasArabic(text) ? "rtl" : "ltr";
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setTyping(isTyping) {
  typingIndicator.classList.toggle("hidden", !isTyping);
}

function maybeShowCta() {
  if (userMessageCount >= 3) {
    ctaCard.classList.remove("hidden");
  }
}

function setSuggestionsDisabled(disabled) {
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
    const isArabic = /[\u0600-\u06FF]/.test(userText || "");

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
    } else if (details.includes("timeout")) {
      userFriendly = isArabic
        ? "انتهت مهلة الاتصال بخدمة Groq. تحقق من الإنترنت ثم أعد المحاولة."
        : "Groq request timed out. Check your connection and try again.";
    }

    createMessage(userFriendly, "bot");
    createMessage((/[\u0600-\u06FF]/.test(userText || "") ? "رد احتياطي: " : "Fallback reply: ") + getLocalFallbackReply(userText), "bot");
    console.error(error);
  } finally {
    setTyping(false);
    isSending = false;
    setSuggestionsDisabled(false);
  }
}

function setupSuggestions() {
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
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".fade-in").forEach((section) => observer.observe(section));
}

function initChat() {
  createMessage(
    `Welcome. I am Ghassan's AI assistant. Using model: ${activeModel}. Please choose one of the suggested questions below.`,
    "bot"
  );
}

setupSuggestions();
setupRoadmapModal();
setupFadeIn();
initChat();
