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
  document.getElementById("take-photo").addEventListener("click", () => {
    simulateQRScan();
  });
  document.getElementById("start-camera").addEventListener("click", () => {
    startCamera();
  });

  nextStepBtn.addEventListener("click", goToNextStep);
  completeCorrecaoBtn.addEventListener("click", completeCorrection);

  // Start camera (when on correction page)
  if (window.location.hash === "#correcao") {
    //startCamera();
  }

  // Check for hash in URL
  handleUrlHash();

  // Listen for hash changes
  window.addEventListener("hashchange", handleUrlHash);

  // Listen for resize events to handle responsive behavior
  window.addEventListener("resize", handleResize);

  // Handle clicks outside sidebar to close it on mobile
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
      // Ensure video fills container while maintaining aspect ratio
      const aspectRatio =
        window.innerWidth > window.innerHeight ? 16 / 9 : 4 / 3;
      videoContainer.style.paddingBottom = `${(1 / aspectRatio) * 100}%`;
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
    setTimeout(() => {
      const videoContainer = qrVideo.parentElement;
      videoContainer.style.position = "relative"; // Garante que o posicionamento absoluto funcione

      // Adiciona o overlay sem substituir o vídeo
      const overlayDiv = document.createElement("div");
      overlayDiv.className = "alignment-overlay";
      overlayDiv.innerHTML = `
        <div class="corner-dot top-left"></div>
        <div class="corner-dot top-right"></div>
        <div class="corner-dot bottom-left"></div>
        <div class="corner-dot bottom-right"></div>
      `;
      videoContainer.appendChild(overlayDiv);

      // Adiciona o estilo para os pontos de marcação
      const style = document.createElement("style");
      style.textContent = `
        .alignment-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
          pointer-events: none;
        }
        .corner-dot {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 0, 0, 0.7);
          border: 2px solid white;
        }
        .top-left {
          top: 10%;
          left: 10%;
        }
        .top-right {
          top: 10%;
          right: 10%;
        }
        .bottom-left {
          bottom: 10%;
          left: 10%;
        }
        .bottom-right {
          bottom: 10%;
          right: 10%;
        }
      `;
      document.head.appendChild(style);
    }, 500); // Pequeno delay para garantir que a câmera esteja ativa

    // Hide next button, show complete button
    nextStepBtn.classList.remove("hidden");
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
  // Create a simple summary of the gabarito responses
  if (!gabarito || !gabarito.respostas) {
    console.log("Gabarito inválido:", gabarito);
    return "N/A";
  }

  // Get the answers as an array
  const respostas = gabarito.respostas;

  // Format each answer as "Q1: A, Q2: B, etc"
  const formattedAnswers = Object.entries(respostas)
    .map(([questao, resposta]) => `Q${questao}: ${resposta}`)
    .join(", ");

  return formattedAnswers || "N/A";
}

// Process QR code data from step 1 (aluno data)
function processAlunoQRData(data) {
  try {
    // Se vier como string JSON contendo 'qr_codes'
    if (typeof data === "object" && typeof data.qr_codes === "string") {
      // Corrige aspas simples para aspas duplas
      const fixedString = data.qr_codes.replace(/'/g, '"');
      data = JSON.parse(fixedString);
    }

    // Salva os dados no estado da aplicação
    currentCorrection.aluno = data;
    currentCorrection.totalQuestoes = data.total_questoes;

    // Atualiza a interface com os dados reais do aluno
    document.getElementById("aluno-nome").textContent =
      data.aluno_nome || "Aluno não encontrado";
    document.getElementById("escola-nome").textContent =
      data.nome_da_escola || "N/A";
    document.getElementById("turma-nome").textContent =
      data.nome_da_turma || "N/A";
    // document.getElementById("turma-serie").textContent = data.serie || "N/A";
    // document.getElementById("turma-turno").textContent = data.turno || "N/A";
    document.getElementById("total-questoes").textContent =
      data.total_questoes || "N/A";

    // Mostra o painel de informações do aluno
    alunoInfo.classList.remove("hidden");

    // Mostra o botão para próxima etapa
    nextStepBtn.classList.remove("hidden");

    // Para a câmera
    stopCamera();

    return true;
  } catch (error) {
    console.error("[ERRO] Falha ao processar dados do aluno:", error);
    alert("Erro ao processar dados do aluno no QR code");
    return false;
  }
}

// Process QR code data from step 2 (gabarito data)
function processGabaritoQRData(data) {
  try {
    // Try to parse the JSON if it's a string
    let parsedData;
    try {
      parsedData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      console.error("Erro ao fazer parse do JSON:", e);
      alert("Erro ao processar dados do gabarito");
      return false;
    }

    // Log the response for debugging
    console.log("Dados do gabarito recebidos:", parsedData);

    // Save the gabarito data
    currentCorrection.gabarito = parsedData;

    // Show the complete correction button
    completeCorrecaoBtn.classList.remove("hidden");

    // Stop the camera
    stopCamera();

    // Return success
    return true;
  } catch (error) {
    console.error("Error processing gabarito QR data:", error);
    alert("Erro ao processar dados do gabarito no QR code");
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

function startCamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Stop any existing stream
    stopCamera();

    // Get constraints based on device
    const constraints = {
      video: {
        facingMode: isMobile() ? "environment" : "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    // Request camera access
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        cameraStream = stream;
        qrVideo.srcObject = stream;
        qrVideo.play();

        // Adjust camera display
        adjustCamera();
      })
      .catch((err) => {
        console.error("Erro ao acessar a câmera:", err);
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
      });
  } else {
    alert("Seu navegador não suporta acesso à câmera");
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    qrVideo.srcObject = null;
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
  if (!cameraStream) return;

  if (currentCorrection.step === 1) {
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
        alert("Erro ao capturar imagem.");
        return;
      }

      // Prepara os dados para envio
      const formData = new FormData();
      formData.append("imagem", blob, "captura.png");

      try {
        const response = await fetch(
          "https://gerador-gabarito-leitor-qrcode.lh6c5d.easypanel.host/api/ler-qrcode/",
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json();
        console.log("Resposta da API:", result);
        handleQRCodeDetection(result);
      } catch (error) {
        console.error("Erro ao enviar imagem para a API:", error);
        alert("Erro ao processar a imagem.");
      }
    }, "image/png");
  } else if (currentCorrection.step === 2) {
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
        alert("Erro ao capturar imagem.");
        return;
      }

      // Prepara os dados para envio exatamente como no exemplo Python
      const formData = new FormData();
      // Equivalente a files={'imagem': img}
      formData.append("imagem", blob, "captura.png");
      // Equivalente a data={'numero_questoes': str(numero_questoes)}
      formData.append(
        "numero_questoes",
        String(currentCorrection.totalQuestoes || "")
      );

      try {
        // Realiza a requisição POST para a API
        const response = await fetch(
          "https://gerador-gabarito-leitor-gabarito.lh6c5d.easypanel.host/api/leitor/",
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json();
        console.log("Resposta da API:", result);
        handleQRCodeDetection(result);
      } catch (error) {
        console.error("Erro ao enviar imagem para a API:", error);
        alert("Erro ao processar a imagem.");
      }
    }, "image/png");
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", init);
