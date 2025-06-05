// Mock data - Simulated database
const USERS = [
  {
    id: 1,
    name: "Administrador",
    login: "admin",
    password: "123456",
    type: "administrador",
  },
];

// Resultados das correções
const CORRECOES = [];

// Current user session
let currentUser = null;

// Estado atual da correção
let currentCorrection = {
  step: 1, // 1 = escaneando aluno, 2 = escaneando gabarito
  aluno: null,
  gabarito: null,
};

// DOM Elements
const loginPage = document.getElementById("login-page");
const app = document.getElementById("app");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const userNameElement = document.getElementById("user-name");
const userAvatarElement = document.getElementById("user-avatar");
const pageTitle = document.getElementById("page-title");

// Login Page Elements
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");

// Navigation Elements
const navItems = document.querySelectorAll(".nav-item");
const adminOnlyElements = document.querySelectorAll(".admin-only");
const openSidebarBtn = document.getElementById("open-sidebar");
const closeSidebarBtn = document.getElementById("close-sidebar");
const logoutBtn = document.getElementById("logout-btn");

// Pages
const pages = document.querySelectorAll(".page");
const navCorrecao = document.getElementById("nav-correcao");
const navUsuarios = document.getElementById("nav-usuarios");
const pageCorrecao = document.getElementById("page-correcao");
const pageUsuarios = document.getElementById("page-usuarios");

// User Management
const addUserBtn = document.getElementById("add-user-btn");
const addUserForm = document.getElementById("add-user-form");
const cancelAddUserBtn = document.getElementById("cancel-add-user");
const saveUserBtn = document.getElementById("save-user");
const newNameInput = document.getElementById("new-name");
const newLoginInput = document.getElementById("new-login");
const newPasswordInput = document.getElementById("new-password");
const newTypeSelect = document.getElementById("new-type");
const usersList = document.getElementById("users-list");

// QR Code Correction Elements
const qrVideo = document.getElementById("qr-video");
const qrResults = document.getElementById("qr-results");
const scanStepText = document.getElementById("scan-step-text");
const scanInstruction = document.getElementById("scan-instruction");
const stepIndicator = document.getElementById("step-indicator");
const alunoInfo = document.getElementById("aluno-info");
const alunoNome = document.getElementById("aluno-nome");
const alunoEscola = document.getElementById("aluno-escola");
const alunoTurma = document.getElementById("aluno-turma");
const resetScanBtn = document.getElementById("reset-scan");
const nextStepBtn = document.getElementById("next-step");
const completeCorrecaoBtn = document.getElementById("complete-correction");

// Initialize the application
function init() {
  // Event Listeners
  loginBtn.addEventListener("click", handleLogin);

  // Add Enter key support for login
  usernameInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      passwordInput.focus();
    }
  });

  passwordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      handleLogin();
    }
  });

  openSidebarBtn.addEventListener("click", openSidebar);
  closeSidebarBtn.addEventListener("click", closeSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);
  logoutBtn.addEventListener("click", handleLogout);

  navCorrecao.addEventListener("click", () =>
    showPage(pageCorrecao, "Correção")
  );
  navUsuarios.addEventListener("click", () =>
    showPage(pageUsuarios, "Gerenciamento de Usuários")
  );

  addUserBtn.addEventListener("click", toggleAddUserForm);
  cancelAddUserBtn.addEventListener("click", toggleAddUserForm);
  saveUserBtn.addEventListener("click", saveUser);

  // Load users list
  renderUsersList();

  // Load QR code results
  renderCorrecoes();

  // Correção buttons
  resetScanBtn.addEventListener("click", resetCorrection);

  // Botão de tirar foto
  const takePhotoBtn = document.getElementById("take-photo");
  if (takePhotoBtn) {
    takePhotoBtn.addEventListener("click", () => {
      if (!cameraStream) {
        alert("Por favor, ative a câmera primeiro.");
        return;
      }
      simulateQRScan();
    });
  }

  // Botão de ativar câmera
  const startCameraBtn = document.getElementById("start-camera");
  if (startCameraBtn) {
    startCameraBtn.addEventListener("click", startCamera);
  }

  nextStepBtn.addEventListener("click", goToNextStep);
  completeCorrecaoBtn.addEventListener("click", completeCorrection);

  // Check for hash in URL
  handleUrlHash();

  // Listen for hash changes
  window.addEventListener("hashchange", handleUrlHash);

  // Listen for resize events
  window.addEventListener("resize", handleResize);

  // Handle clicks outside sidebar
  document.addEventListener("click", function (e) {
    if (
      window.innerWidth < 768 &&
      !sidebar.contains(e.target) &&
      !openSidebarBtn.contains(e.target) &&
      sidebar.classList.contains("translate-x-0")
    ) {
      closeSidebar();
    }
  });

  // Initial resize handler call
  handleResize();
}

// Handle resize events
function handleResize() {
  if (window.innerWidth >= 768) {
    // On desktop/tablet, ensure sidebar is visible
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
  } else {
    // On mobile, hide sidebar unless explicitly opened
    if (!sidebar.classList.contains("translate-x-0")) {
      sidebar.classList.add("-translate-x-full");
    }
  }

  // Adjust camera size if it's active
  adjustCamera();
}

// Adjust camera based on device orientation and size
function adjustCamera() {
  if (cameraStream && qrVideo) {
    const videoContainer = qrVideo.parentElement;
    if (videoContainer) {
      if (currentCorrection.step === 2) {
        // Para a etapa 2 (folha A4), otimizar para leitura próxima do papel
        videoContainer.style.maxWidth = "100%";
        videoContainer.style.width = "100%";
        videoContainer.style.height = "80vh";
        videoContainer.style.maxHeight = "80vh";
        videoContainer.style.margin = "0 auto";
        videoContainer.style.position = "relative";
        videoContainer.style.overflow = "hidden";
        videoContainer.style.backgroundColor = "#000";

        // Ajusta o vídeo para melhor visualização do papel A4
        qrVideo.style.width = "100%";
        qrVideo.style.height = "100%";
        qrVideo.style.objectFit = "contain"; // Mudado para 'contain' para não cortar as bordas
        qrVideo.style.position = "absolute";
        qrVideo.style.top = "50%";
        qrVideo.style.left = "50%";
        qrVideo.style.transform = "translate(-50%, -50%)";

        // Adiciona guias de alinhamento para o papel A4
        const guide = videoContainer.querySelector(".qr-guide");
        if (guide) {
          guide.style.width = "85%";
          guide.style.height = "95%";
          guide.style.border = "2px solid rgba(255, 255, 255, 0.8)";
          guide.style.boxShadow = "0 0 0 2000px rgba(0, 0, 0, 0.3)";
        }
      } else {
        // Para a etapa 1 (QR code), otimizar para leitura do QR
        videoContainer.style.width = "100%";
        videoContainer.style.maxWidth = "500px";
        videoContainer.style.height = "500px";
        videoContainer.style.margin = "0 auto";
        videoContainer.style.position = "relative";
        videoContainer.style.overflow = "hidden";
        videoContainer.style.backgroundColor = "#000";

        // Ajusta o vídeo para melhor leitura do QR
        qrVideo.style.width = "100%";
        qrVideo.style.height = "100%";
        qrVideo.style.objectFit = "cover";
        qrVideo.style.position = "absolute";
        qrVideo.style.top = "50%";
        qrVideo.style.left = "50%";
        qrVideo.style.transform = "translate(-50%, -50%)";

        // Ajusta o guia para o QR code
        const guide = videoContainer.querySelector(".qr-guide");
        if (guide) {
          guide.style.width = "70%";
          guide.style.height = "70%";
          guide.style.border = "2px solid rgba(255, 255, 255, 0.5)";
          guide.style.boxShadow = "none";
        }
      }
    }
  }
}

// Get user initials from name
function getUserInitials(name) {
  if (!name) return "US";

  const nameParts = name.split(" ");
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }

  return (
    nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
  ).toUpperCase();
}

// Handle login
function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Por favor, preencha todos os campos");
    return;
  }

  const user = USERS.find(
    (u) => u.login === username && u.password === password
  );

  if (user) {
    // Set current user
    currentUser = user;

    // Update UI
    userNameElement.textContent = user.name;

    // Update avatar
    const initials = getUserInitials(user.name);
    userAvatarElement.textContent = initials;

    // Show admin-only elements if admin
    if (user.type === "administrador") {
      adminOnlyElements.forEach((el) => el.classList.remove("hidden"));
    } else {
      adminOnlyElements.forEach((el) => el.classList.add("hidden"));
    }

    // Show app
    loginPage.classList.add("opacity-0");
    setTimeout(() => {
      loginPage.classList.add("hidden");
      app.classList.remove("hidden");
      setTimeout(() => {
        app.classList.remove("opacity-0");
      }, 50);
    }, 300);

    // Set default page
    showPage(pageCorrecao, "Correção");
    window.location.hash = "correcao";
  } else {
    alert("Usuário ou senha inválidos");
  }
}

// Handle logout
function handleLogout() {
  // Reset current user
  currentUser = null;

  // Stop camera
  stopCamera();

  // Show login page
  app.classList.add("opacity-0");
  setTimeout(() => {
    app.classList.add("hidden");
    loginPage.classList.remove("hidden");
    setTimeout(() => {
      loginPage.classList.remove("opacity-0");
    }, 50);
  }, 300);

  // Clear form fields
  usernameInput.value = "";
  passwordInput.value = "";

  // Clear hash
  window.location.hash = "";
}

// Show specific page
function showPage(pageToShow, title) {
  // Update page title
  pageTitle.textContent = title;

  // Hide all pages
  pages.forEach((page) => {
    page.classList.add("hidden");
  });

  // Show selected page
  pageToShow.classList.remove("hidden");

  // Update active navigation
  navItems.forEach((item) => {
    item.classList.remove("bg-primary-700");
  });

  // Add active class to current nav item
  if (pageToShow === pageCorrecao) {
    navCorrecao.classList.add("bg-primary-700");
    //startCamera();
    resetCorrection(); // Reset to a clean state
  } else if (pageToShow === pageUsuarios) {
    navUsuarios.classList.add("bg-primary-700");
    stopCamera();
  }

  // Close sidebar on mobile
  if (window.innerWidth < 768) {
    closeSidebar();
  }
}

// Handle URL hash changes
function handleUrlHash() {
  const hash = window.location.hash.substring(1);

  if (hash === "correcao") {
    showPage(pageCorrecao, "Correção");
  } else if (hash === "usuarios") {
    showPage(pageUsuarios, "Gerenciamento de Usuários");
  }
}

// Toggle sidebar on mobile
function openSidebar() {
  sidebar.classList.remove("-translate-x-full");
  sidebar.classList.add("translate-x-0");

  // Add overlay for mobile
  if (window.innerWidth < 768) {
    // Prevent scrolling the body when sidebar is open
    document.body.style.overflow = "hidden";
    sidebarOverlay.classList.add("active");
  }
}

function closeSidebar() {
  if (window.innerWidth < 768) {
    sidebar.classList.remove("translate-x-0");
    sidebar.classList.add("-translate-x-full");

    // Restore body scrolling
    document.body.style.overflow = "";
    sidebarOverlay.classList.remove("active");
  }
}

// Toggle add user form
function toggleAddUserForm() {
  addUserForm.classList.toggle("hidden");
  if (!addUserForm.classList.contains("hidden")) {
    newNameInput.focus();
  } else {
    // Clear form
    newNameInput.value = "";
    newLoginInput.value = "";
    newPasswordInput.value = "";
    newTypeSelect.value = "administrador";
  }
}

// Save new user
function saveUser() {
  const name = newNameInput.value.trim();
  const login = newLoginInput.value.trim();
  const password = newPasswordInput.value.trim();
  const type = newTypeSelect.value;

  if (!name || !login || !password) {
    alert("Por favor, preencha todos os campos obrigatórios");
    return;
  }

  // Check if login already exists
  if (USERS.some((u) => u.login === login)) {
    alert("Este login já está em uso");
    return;
  }

  // Create new user
  const newUser = {
    id: USERS.length + 1,
    name,
    login,
    password,
    type,
  };

  // Add to users array
  USERS.push(newUser);

  // Update UI
  renderUsersList();

  // Hide form
  toggleAddUserForm();

  // Feedback
  alert("Usuário adicionado com sucesso");
}

// Render users list
function renderUsersList() {
  usersList.innerHTML = "";

  USERS.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="py-2 px-4 border-b">${user.name}</td>
            <td class="py-2 px-4 border-b">${user.login}</td>
            <td class="py-2 px-4 border-b">${user.type}</td>
            <td class="py-2 px-4 border-b">
                <button class="delete-user text-red-600 hover:text-red-800 transition duration-300 mr-2" data-id="${user.id}">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="edit-user text-blue-600 hover:text-blue-800 transition duration-300" data-id="${user.id}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;

    // Add event listeners (in a real app)
    const deleteBtn = tr.querySelector(".delete-user");
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Deseja excluir o usuário ${user.name}?`)) {
        // Don't allow deleting the only admin
        if (
          user.type === "administrador" &&
          USERS.filter((u) => u.type === "administrador").length <= 1
        ) {
          alert("Não é possível excluir o único administrador");
          return;
        }

        // Remove from array
        const index = USERS.findIndex((u) => u.id === user.id);
        if (index !== -1) {
          USERS.splice(index, 1);
          renderUsersList();
        }
      }
    });

    usersList.appendChild(tr);
  });
}

// Reset correction to initial state
function resetCorrection() {
  currentCorrection = {
    step: 1,
    aluno: null,
    gabarito: null,
  };

  // Update UI
  scanStepText.textContent = "Etapa 1: Escaneie o QR Code do Aluno";
  scanInstruction.textContent =
    "Posicione o QR code com os dados do aluno na câmera";
  stepIndicator.textContent = "Etapa 1/2";

  // Hide aluno info
  alunoInfo.classList.add("hidden");

  // Hide buttons
  nextStepBtn.classList.add("hidden");
  completeCorrecaoBtn.classList.add("hidden");

  // Restart camera if needed
  if (!cameraStream) {
    //startCamera();
  }
}

// Go to the next step of the correction process
function goToNextStep() {
  if (currentCorrection.step === 1 && currentCorrection.aluno) {
    // Move to step 2
    currentCorrection.step = 2;

    // Update UI
    scanStepText.textContent = "Etapa 2: Escaneie o QR Code do Gabarito";
    scanInstruction.textContent =
      "Posicione o QR code com as respostas do gabarito na câmera";
    stepIndicator.textContent = "Etapa 2/2";

    // Primeiro ativa a câmera
    startCamera();

    // Depois adiciona os pontos de marcação para a etapa 2
    const videoContainer = qrVideo.parentElement;
    if (videoContainer) {
      // Remove overlay anterior se existir
      const oldOverlay = videoContainer.querySelector(".alignment-overlay");
      if (oldOverlay) {
        oldOverlay.remove();
      }

      // Adiciona novo overlay com os pontos
      const overlayDiv = document.createElement("div");
      overlayDiv.className = "alignment-overlay";
      overlayDiv.innerHTML = `
        <div class="corner-dot top-left"></div>
        <div class="corner-dot top-right"></div>
        <div class="corner-dot bottom-left"></div>
        <div class="corner-dot bottom-right"></div>
      `;
      videoContainer.appendChild(overlayDiv);
    }
  }
}

// Complete the correction process
function completeCorrection() {
  if (
    currentCorrection.step === 2 &&
    currentCorrection.aluno &&
    currentCorrection.gabarito
  ) {
    // Add to corrected items
    const newCorrecao = {
      id: CORRECOES.length + 1,
      aluno: currentCorrection.aluno.aluno_nome,
      escola: currentCorrection.aluno.nome_da_escola,
      turma: currentCorrection.aluno.nome_da_turma,
      gabarito: formatGabarito(currentCorrection.gabarito),
      timestamp: new Date(),
      status: "Corrigido",
    };

    CORRECOES.push(newCorrecao);

    // Update UI
    renderCorrecoes();

    // Reset for the next correction
    resetCorrection();

    // Feedback
    alert("Correção finalizada com sucesso!");
  }
}

// Format gabarito for display
function formatGabarito(gabarito) {
  try {
    console.log("Formatando gabarito:", gabarito);

    // Se não houver gabarito ou respostas
    if (!gabarito || (!gabarito.respostas && typeof gabarito !== "object")) {
      return "N/A";
    }

    // Usa as respostas do objeto gabarito ou o próprio objeto se não houver propriedade 'respostas'
    const respostas = gabarito.respostas || gabarito;

    // Formata as respostas
    const formattedAnswers = Object.entries(respostas)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0])) // Ordena por número da questão
      .map(([questao, resposta]) => `Q${questao}: ${resposta}`)
      .join(", ");

    return formattedAnswers || "N/A";
  } catch (error) {
    console.error("[ERRO] Falha ao formatar gabarito:", error);
    return "Erro ao formatar gabarito";
  }
}

// Process QR code data from step 1 (aluno data)
function processAlunoQRData(data) {
  try {
    console.log("Dados brutos do aluno recebidos:", data);

    // Se vier como string JSON
    let parsedData = data;
    if (typeof data === "string") {
      parsedData = JSON.parse(data);
    }

    // Se vier dentro de um objeto com qr_codes
    if (parsedData.qr_codes) {
      try {
        // Tenta corrigir aspas simples para duplas
        const fixedString = parsedData.qr_codes.replace(/'/g, '"');
        parsedData = JSON.parse(fixedString);
      } catch (e) {
        console.error("Erro ao fazer parse do qr_codes:", e);
        parsedData = parsedData.qr_codes; // Usa o valor original se falhar
      }
    }

    console.log("Dados do aluno após parse:", parsedData);

    // Verifica se os dados necessários estão presentes
    if (
      !parsedData.aluno_nome ||
      !parsedData.nome_da_escola ||
      !parsedData.nome_da_turma
    ) {
      throw new Error("Dados do aluno incompletos no QR code");
    }

    // Salva os dados no estado da aplicação
    currentCorrection.aluno = parsedData;
    currentCorrection.totalQuestoes = parsedData.total_questoes || 0;

    // Atualiza a interface com os dados do aluno
    document.getElementById("aluno-nome").textContent = parsedData.aluno_nome;
    document.getElementById("escola-nome").textContent =
      parsedData.nome_da_escola;
    document.getElementById("turma-nome").textContent =
      parsedData.nome_da_turma;
    document.getElementById("total-questoes").textContent =
      parsedData.total_questoes || "N/A";

    // Mostra o painel de informações do aluno
    alunoInfo.classList.remove("hidden");

    // Mostra o botão para próxima etapa
    nextStepBtn.classList.remove("hidden");

    // Para a câmera
    stopCamera();

    return true;
  } catch (error) {
    console.error("[ERRO] Falha ao processar dados do aluno:", error);
    alert("Erro ao processar dados do aluno: " + error.message);
    return false;
  }
}

// Process QR code data from step 2 (gabarito data)
function processGabaritoQRData(data) {
  try {
    console.log("Dados brutos do gabarito recebidos:", data);

    // Se vier como string JSON
    let parsedData = data;
    if (typeof data === "string") {
      parsedData = JSON.parse(data);
    }

    // Se vier dentro de um objeto com qr_codes
    if (parsedData.qr_codes) {
      try {
        // Tenta corrigir aspas simples para duplas
        const fixedString = parsedData.qr_codes.replace(/'/g, '"');
        parsedData = JSON.parse(fixedString);
      } catch (e) {
        console.error("Erro ao fazer parse do qr_codes:", e);
        parsedData = parsedData.qr_codes; // Usa o valor original se falhar
      }
    }

    console.log("Dados do gabarito após parse:", parsedData);

    // Verifica se há respostas no gabarito
    if (!parsedData.respostas && typeof parsedData === "object") {
      // Se não houver propriedade 'respostas', assume que o objeto inteiro é o gabarito
      parsedData = { respostas: parsedData };
    }

    // Verifica se os dados são válidos
    if (
      !parsedData.respostas ||
      Object.keys(parsedData.respostas).length === 0
    ) {
      throw new Error("Nenhuma resposta encontrada no gabarito");
    }

    // Salva os dados no estado da aplicação
    currentCorrection.gabarito = parsedData;

    // Mostra o botão de finalizar correção
    completeCorrecaoBtn.classList.remove("hidden");

    // Para a câmera
    stopCamera();

    return true;
  } catch (error) {
    console.error("[ERRO] Falha ao processar gabarito:", error);
    alert("Erro ao processar gabarito: " + error.message);
    return false;
  }
}

// Handle QR code detection
function handleQRCodeDetection(data) {
  // Process based on the current step
  if (currentCorrection.step === 1) {
    // Process aluno data
    if (processAlunoQRData(data)) {
      playSuccessSound();
    }
  } else if (currentCorrection.step === 2) {
    // Process gabarito data
    if (processGabaritoQRData(data)) {
      playSuccessSound();
    }
  }
}

// Play a success sound when QR code is detected
function playSuccessSound() {
  try {
    // Create a simple beep sound
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1000, context.currentTime);
    oscillator.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio not supported or blocked by browser policy:", e);
  }
}

// Render the list of completed corrections
function renderCorrecoes() {
  qrResults.innerHTML = "";

  CORRECOES.forEach((correcao) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="py-2 px-4 border-b">${correcao.aluno}</td>
            <td class="py-2 px-4 border-b">${correcao.escola}</td>
            <td class="py-2 px-4 border-b">${correcao.turma}</td>
            <td class="py-2 px-4 border-b">${correcao.gabarito}</td>
            <td class="py-2 px-4 border-b">
                <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    ${correcao.status}
                </span>
            </td>
        `;

    qrResults.appendChild(tr);
  });

  // If there are no corrections yet, show a message
  if (CORRECOES.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td colspan="5" class="py-4 px-4 text-center text-gray-500">
                Nenhuma correção realizada ainda
            </td>
        `;
    qrResults.appendChild(tr);
  }
}
// Camera handling for QR code
let cameraStream = null;

// Start camera with optimized settings
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Seu navegador não suporta acesso à câmera");
    return;
  }

  try {
    // Primeiro tenta parar qualquer stream existente
    stopCamera();

    // Lista todas as câmeras disponíveis
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");

    // Se não houver câmeras, retorna erro
    if (cameras.length === 0) {
      throw new Error("Nenhuma câmera encontrada no dispositivo");
    }

    // Tenta diferentes configurações de câmera em ordem de preferência
    const constraints = [
      // Primeira tentativa: câmera traseira com configurações ideais
      {
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      },
      // Segunda tentativa: câmera traseira com configurações básicas
      {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      // Terceira tentativa: qualquer câmera disponível
      {
        video: true,
      },
    ];

    let stream = null;
    let error = null;

    // Tenta cada configuração até uma funcionar
    for (const constraint of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint);
        if (stream) break;
      } catch (e) {
        error = e;
        console.log("Tentativa falhou, tentando próxima configuração...", e);
        continue;
      }
    }

    // Se nenhuma tentativa funcionou, lança o último erro
    if (!stream) {
      throw error || new Error("Não foi possível iniciar a câmera");
    }

    // Configura o stream no vídeo
    cameraStream = stream;
    qrVideo.srcObject = stream;

    // Aguarda o carregamento do vídeo
    await new Promise((resolve) => {
      qrVideo.onloadedmetadata = () => {
        qrVideo
          .play()
          .then(resolve)
          .catch((e) => {
            console.error("Erro ao iniciar reprodução do vídeo:", e);
            resolve(); // Continua mesmo com erro de play
          });
      };
    });

    // Ajusta o layout da câmera
    adjustCamera();

    // Adiciona classe de feedback visual
    qrVideo.classList.add("camera-active");

    console.log("Câmera iniciada com sucesso!");
  } catch (err) {
    console.error("Erro detalhado ao acessar a câmera:", err);

    let mensagemErro = "Não foi possível acessar a câmera. ";

    if (err.name === "NotAllowedError") {
      mensagemErro +=
        "Verifique se você permitiu o acesso à câmera nas configurações do navegador.";
    } else if (err.name === "NotReadableError") {
      mensagemErro +=
        "A câmera pode estar sendo usada por outro aplicativo. Feche outros aplicativos que possam estar usando a câmera e tente novamente.";
    } else if (err.name === "NotFoundError") {
      mensagemErro += "Nenhuma câmera foi encontrada no dispositivo.";
    } else {
      mensagemErro += "Erro: " + (err.message || err.name || "desconhecido");
    }

    alert(mensagemErro);
  }
}

// Função mais robusta para parar a câmera
function stopCamera() {
  if (cameraStream) {
    try {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
        cameraStream.removeTrack(track);
      });
    } catch (e) {
      console.error("Erro ao parar câmera:", e);
    }
    cameraStream = null;
  }

  if (qrVideo) {
    try {
      qrVideo.srcObject = null;
      qrVideo.classList.remove("camera-active");
    } catch (e) {
      console.error("Erro ao limpar vídeo:", e);
    }
  }
}

// Check if user is on a mobile device
function isMobile() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768
  );
}

// Simulated QR code scanning (in a real app, this would use a QR code library)
async function simulateQRScan() {
  if (!cameraStream) {
    alert("Câmera não está ativa. Por favor, ative a câmera primeiro.");
    return;
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Ajusta o tamanho do canvas para o vídeo
    canvas.width = qrVideo.videoWidth;
    canvas.height = qrVideo.videoHeight;

    // Desenha o frame atual do vídeo no canvas
    context.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);

    // Converte o canvas para blob (imagem PNG)
    canvas.toBlob(async function (blob) {
      if (!blob) {
        throw new Error("Erro ao capturar imagem");
      }

      const formData = new FormData();
      const file = new File([blob], "captura.png", { type: "image/png" });
      formData.append("imagem", file);

      // Adiciona o número de questões apenas na etapa 2
      if (currentCorrection.step === 2) {
        formData.append(
          "numero_questoes",
          String(currentCorrection.totalQuestoes || "")
        );
      }

      // Define a URL da API baseado na etapa
      const apiUrl =
        currentCorrection.step === 1
          ? "https://gerador-gabarito-leitor-qrcode.lh6c5d.easypanel.host/api/ler-qrcode/"
          : "https://gerador-gabarito-leitor-gabarito.lh6c5d.easypanel.host/api/leitor/";

      // Faz a requisição para a API
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      console.log("Resposta da API:", result);

      // Processa o resultado
      handleQRCodeDetection(result);
    }, "image/png");
  } catch (error) {
    console.error("Erro ao processar imagem:", error);
    alert("Erro ao processar a imagem: " + error.message);
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", init);

// Atualizar o CSS para o container de vídeo
const style = document.createElement("style");
style.textContent = `
  .video-container {
    position: relative;
    margin: 0 auto;
    background: black;
    overflow: hidden;
    border-radius: 8px;
  }

  .video-container video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    .video-container {
      width: 100% !important;
      max-width: none !important;
    }
  }
`;
document.head.appendChild(style);
