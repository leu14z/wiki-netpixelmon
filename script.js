// Lógica Interativa - Wiki NetPixelmon

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. Gerenciamento de Páginas (Menu Lateral)
  // ==========================================
  const navItems = document.querySelectorAll(".nav-item");
  const wikiPages = document.querySelectorAll(".wiki-page");
  const sidebarMenu = document.getElementById("sidebarMenu");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const menuToggle = document.getElementById("menuToggle");
  let currentPage = "home";

  function switchPage(pageId) {
    if (!pageId) return;
    
    // Desativar páginas e itens ativos
    wikiPages.forEach(p => p.classList.remove("active"));
    navItems.forEach(item => item.classList.remove("active"));

    // Ativar a página selecionada
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.add("active");
      currentPage = pageId;
      
      // Marcar item do menu correspondente
      const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
      if (activeNav) activeNav.classList.add("active");

      // Gerar o índice dinâmico (TOC) para a página ativa
      generateTOC(targetPage);

      // Scroll para o topo
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Se for para o Breed, inicia carregando o tipo Bug por padrão
    if (pageId === "breed") {
      const activeTypeBtn = document.querySelector(".type-btn.active");
      if (!activeTypeBtn) {
        // Clica no primeiro botão de tipo carregado
        const firstBtn = document.querySelector(".type-btn");
        if (firstBtn) firstBtn.click();
      }
    }

    // Fechar menu mobile se estiver aberto
    sidebarMenu.classList.remove("active");
    sidebarBackdrop.classList.remove("active");
  }

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const pageId = item.getAttribute("data-page");
      switchPage(pageId);
    });
  });

  // Toggle de Menu Lateral Mobile
  if (menuToggle && sidebarMenu && sidebarBackdrop) {
    menuToggle.addEventListener("click", () => {
      sidebarMenu.classList.add("active");
      sidebarBackdrop.classList.add("active");
    });

    sidebarBackdrop.addEventListener("click", () => {
      sidebarMenu.classList.remove("active");
      sidebarBackdrop.classList.remove("active");
    });
  }

  // ==========================================
  // 2. Renderização Dinâmica - Blocos de Breed
  // ==========================================
  const typesGrid = document.getElementById("typesGrid");
  const blocksGrid = document.getElementById("blocksGrid");
  const panelTitle = document.getElementById("panelTitle");
  const panelIcon = document.getElementById("panelIcon");
  const breedDetailPanel = document.getElementById("breedDetailPanel");
  const panelSearch = document.getElementById("panelSearch");
  let activeElement = "";

  // Cria os botões dos tipos elementais
  function initBreedTypes() {
    if (!typesGrid) return;
    typesGrid.innerHTML = "";

    Object.keys(BREED_DATA).forEach(key => {
      const type = BREED_DATA[key];
      const btn = document.createElement("button");
      btn.className = "type-btn";
      btn.style.color = type.color;
      btn.style.borderColor = `${type.color}33`; // 20% de opacidade
      btn.innerHTML = `
        <span class="type-btn-icon">${type.icon}</span>
        <span class="type-btn-name">${type.name}</span>
      `;

      btn.addEventListener("click", () => {
        // Alterar botões ativos
        document.querySelectorAll(".type-btn").forEach(b => {
          b.classList.remove("active");
          b.style.backgroundColor = "";
          b.style.color = BREED_DATA[b.querySelector(".type-btn-name").textContent.toLowerCase() === "lutador" ? "fighting" : Object.keys(BREED_DATA).find(k => BREED_DATA[k].name === b.querySelector(".type-btn-name").textContent)].color;
        });

        btn.classList.add("active");
        btn.style.backgroundColor = type.color;
        btn.style.color = "#ffffff";
        
        activeElement = key;
        loadBlocksForType(key);
      });

      typesGrid.appendChild(btn);
    });
  }

  // Carrega os blocos do tipo elemental selecionado
  function loadBlocksForType(typeKey, query = "") {
    if (!blocksGrid) return;
    const typeInfo = BREED_DATA[typeKey];
    if (!typeInfo) return;

    panelTitle.textContent = `Blocos de Breed: ${typeInfo.name}`;
    panelIcon.textContent = typeInfo.icon;
    breedDetailPanel.style.borderTop = `4px solid ${typeInfo.color}`;

    blocksGrid.innerHTML = "";
    const filteredBlocks = typeInfo.blocks.filter(block => {
      const q = query.toLowerCase();
      return block.pt.toLowerCase().includes(q) || block.id.toLowerCase().includes(q);
    });

    if (filteredBlocks.length === 0) {
      blocksGrid.innerHTML = `<div class="no-selection-msg">Nenhum bloco encontrado para "${query}".</div>`;
      return;
    }

    filteredBlocks.forEach(block => {
      const card = document.createElement("div");
      card.className = "block-card";
      card.innerHTML = `
        <div class="block-header">
          <span class="block-name">${block.pt}</span>
          <span class="block-points points-${block.points}">${block.points} Ponto${block.points > 1 ? 's' : ''}</span>
        </div>
        <span class="block-id">${block.id}</span>
      `;
      blocksGrid.appendChild(card);
    });
  }

  // Input de busca do painel detalhado
  if (panelSearch) {
    panelSearch.addEventListener("input", (e) => {
      if (activeElement) {
        loadBlocksForType(activeElement, e.target.value);
      }
    });
  }

  // ==========================================
  // 3. Simulador de Cerca de Breed (Rancho 9x9)
  // ==========================================
  const simType = document.getElementById("simType");
  const simBlock = document.getElementById("simBlock");
  const simCount = document.getElementById("simCount");
  const btnAddToSim = document.getElementById("btnAddToSim");
  const simScore = document.getElementById("simScore");
  const simLevel = document.getElementById("simLevel");
  const simTime = document.getElementById("simTime");
  const satisfactionFill = document.getElementById("satisfactionFill");
  const simDescription = document.getElementById("simDescription");

  // Popula o select do tipo no simulador
  function initSimulator() {
    if (!simType || !simBlock) return;
    simType.innerHTML = "";
    
    Object.keys(BREED_DATA).forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = BREED_DATA[key].name;
      simType.appendChild(opt);
    });

    simType.addEventListener("change", updateSimBlocks);
    updateSimBlocks();
  }

  // Popula o select de blocos com base no tipo no simulador
  function updateSimBlocks() {
    const typeKey = simType.value;
    const typeInfo = BREED_DATA[typeKey];
    if (!typeInfo) return;

    simBlock.innerHTML = "";
    typeInfo.blocks.forEach(block => {
      const opt = document.createElement("option");
      opt.value = block.points;
      opt.textContent = `${block.pt} (${block.points} pts)`;
      simBlock.appendChild(opt);
    });
  }

  // Calcula os resultados do simulador de breed
  function calculateSimResults() {
    const pointsPerBlock = parseInt(simBlock.value) || 0;
    let count = parseInt(simCount.value) || 0;
    
    if (count > 81) {
      count = 81;
      simCount.value = 81;
    }
    if (count < 0) {
      count = 0;
      simCount.value = 0;
    }

    const totalScore = pointsPerBlock * count;
    simScore.textContent = totalScore;

    // Determina satisfação e tempos de breed oficiais do Pixelmon
    let satisfaction = "Nenhum";
    let satisfactionClass = "none";
    let progressPercent = 0;
    let timeText = "2h 30m";
    let descText = "Os dois Pokémons não têm o menor interesse um no outro.";

    // Faixas de eficiência baseadas na pontuação total do Rancho
    if (totalScore >= 180) {
      satisfaction = "Excelente";
      satisfactionClass = "high";
      progressPercent = 100;
      timeText = "15 minutos";
      descText = "O amor está no ar! Os Pokémons estão extremamente confortáveis e o breed será muito rápido.";
    } else if (totalScore >= 140) {
      satisfaction = "Muito Alto";
      satisfactionClass = "high";
      progressPercent = 80;
      timeText = "30 minutos";
      descText = "Os Pokémons se sentem em casa. A velocidade de cruzamento está quase no máximo.";
    } else if (totalScore >= 100) {
      satisfaction = "Médio";
      satisfactionClass = "med";
      progressPercent = 55;
      timeText = "45 minutos";
      descText = "Os Pokémons parecem se dar muito bem na cerca atual.";
    } else if (totalScore >= 50) {
      satisfaction = "Baixo";
      satisfactionClass = "low";
      progressPercent = 30;
      timeText = "1h 15m";
      descText = "Os Pokémons se toleram, mas a procriação será devagar. Adicione blocos de maior valor.";
    } else {
      satisfaction = "Nenhum";
      satisfactionClass = "none";
      progressPercent = 10;
      timeText = "2h 30m";
      descText = "A satisfação é muito baixa. Adicione mais blocos do tipo correto na cerca de 9x9.";
    }

    // Atualiza a interface
    simLevel.textContent = satisfaction;
    simLevel.className = `result-val satisfaction-badge ${satisfactionClass}`;
    simTime.textContent = timeText;
    simDescription.textContent = descText;
    
    // Atualiza cor e tamanho da barra de progresso
    satisfactionFill.style.width = `${progressPercent}%`;
    if (satisfactionClass === "high") {
      satisfactionFill.style.backgroundColor = "#10b981"; // verde
    } else if (satisfactionClass === "med") {
      satisfactionFill.style.backgroundColor = "#f59e0b"; // laranja
    } else if (satisfactionClass === "low") {
      satisfactionFill.style.backgroundColor = "#ef4444"; // vermelho
    } else {
      satisfactionFill.style.backgroundColor = "#94a3b8"; // cinza
    }
  }

  if (btnAddToSim) {
    btnAddToSim.addEventListener("click", calculateSimResults);
  }

  // ==========================================
  // 4. Busca Geral e Inteligente (Cabeçalho)
  // ==========================================
  const wikiSearch = document.getElementById("wikiSearch");
  const searchResults = document.getElementById("searchResults");

  function performSearch(query) {
    if (!query) {
      searchResults.classList.remove("active");
      return;
    }

    searchResults.innerHTML = "";
    const matches = [];

    // Busca 1: Nas páginas estáticas
    const pages = [
      { id: "home", title: "Página Inicial (Wiki)", category: "Informações" },
      { id: "instalacao", title: "Como Baixar e Instalar", category: "Instalação" },
      { id: "vips", title: "Vantagens VIP e Kits", category: "VIPs" },
      { id: "duvidas", title: "Dúvidas Frequentes (FAQ)", category: "FAQ" },
      { id: "breed", title: "Blocos de Breed (Guia Completo)", category: "Reprodução" }
    ];

    pages.forEach(p => {
      if (p.title.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          type: "page",
          title: p.title,
          sub: p.category,
          color: "#2563eb",
          target: p.id
        });
      }
    });

    // Busca 2: Nos tipos elementais de Breed
    Object.keys(BREED_DATA).forEach(key => {
      const type = BREED_DATA[key];
      if (type.name.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          type: "type",
          title: `Tipo Elemental: ${type.name}`,
          sub: `Breed - ${type.blocks.length} blocos`,
          color: type.color,
          target: `breed:${key}`
        });
      }

      // Busca 3: Nos blocos individuais dentro desse tipo
      type.blocks.forEach(block => {
        if (block.pt.toLowerCase().includes(query.toLowerCase()) || block.id.toLowerCase().includes(query.toLowerCase())) {
          matches.push({
            type: "block",
            title: `${block.pt} (+${block.points} pts)`,
            sub: `Bloco de Breed - ${block.id}`,
            color: type.color,
            target: `breed:${key}:${block.pt}`
          });
        }
      });
    });

    // Renderiza resultados da pesquisa
    if (matches.length === 0) {
      searchResults.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">Nenhum resultado encontrado.</div>`;
      searchResults.classList.add("active");
      return;
    }

    // Exibe no máximo 6 resultados para não quebrar o layout
    matches.slice(0, 7).forEach(match => {
      const div = document.createElement("div");
      div.className = "search-result-item";
      div.innerHTML = `
        <div>
          <div class="search-result-title">${match.title}</div>
          <div class="search-result-sub">${match.sub}</div>
        </div>
        <span class="search-result-tag" style="background-color: ${match.color}">${match.type.toUpperCase()}</span>
      `;

      div.addEventListener("click", () => {
        searchResults.classList.remove("active");
        wikiSearch.value = "";

        if (match.type === "page") {
          switchPage(match.target);
        } else if (match.type === "type") {
          const typeKey = match.target.split(":")[1];
          switchPage("breed");
          // Espera a renderização das abas e ativa
          setTimeout(() => {
            const btn = document.querySelector(`.type-btn[style*="color: rgb"] .type-btn-name`);
            const targetBtn = Array.from(document.querySelectorAll(".type-btn")).find(b => b.querySelector(".type-btn-name").textContent === BREED_DATA[typeKey].name);
            if (targetBtn) targetBtn.click();
          }, 50);
        } else if (match.type === "block") {
          const parts = match.target.split(":");
          const typeKey = parts[1];
          const blockName = parts[2];
          switchPage("breed");
          
          setTimeout(() => {
            const targetBtn = Array.from(document.querySelectorAll(".type-btn")).find(b => b.querySelector(".type-btn-name").textContent === BREED_DATA[typeKey].name);
            if (targetBtn) targetBtn.click();
            
            // Foca a busca do painel e filtra o bloco específico
            if (panelSearch) {
              panelSearch.value = blockName;
              loadBlocksForType(typeKey, blockName);
            }
          }, 50);
        }
      });

      searchResults.appendChild(div);
    });

    searchResults.classList.add("active");
  }

  if (wikiSearch) {
    wikiSearch.addEventListener("input", (e) => {
      performSearch(e.target.value.trim());
    });

    // Fecha o dropdown ao clicar fora
    document.addEventListener("click", (e) => {
      if (!wikiSearch.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove("active");
      }
    });

    // Atalho Ctrl+K para focar busca
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        wikiSearch.focus();
      }
    });
  }

  // ==========================================
  // 5. Alternador de Temas (Claro / Escuro)
  // ==========================================
  const themeBtns = document.querySelectorAll(".theme-btn");
  const currentTheme = localStorage.getItem("theme") || "light";

  // Define tema inicial
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeUI(currentTheme);

  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTheme = btn.getAttribute("data-theme-btn");
      document.documentElement.setAttribute("data-theme", targetTheme);
      localStorage.setItem("theme", targetTheme);
      updateThemeUI(targetTheme);
    });
  });

  function updateThemeUI(theme) {
    themeBtns.forEach(b => {
      if (b.getAttribute("data-theme-btn") === theme) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
  }

  // ==========================================
  // 6. Tabela de Conteúdos Dinâmica (TOC)
  // ==========================================
  const tocList = document.getElementById("tocList");

  function generateTOC(pageSection) {
    if (!tocList) return;
    tocList.innerHTML = "";

    // Procura todos os h2 (títulos de seção) na página ativa que possuem ID
    const headings = pageSection.querySelectorAll("h2[id]");
    
    if (headings.length === 0) {
      // Se não houver headings na página, insere links estáticos ou oculta
      tocList.innerHTML = `<li><a href="#" class="active">Visão Geral</a></li>`;
      return;
    }

    headings.forEach((heading, idx) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${heading.id}`;
      a.textContent = heading.textContent.replace(/^[^\s]+\s+/, ''); // Remove os emojis do título no menu lateral
      if (idx === 0) a.className = "active";

      a.addEventListener("click", (e) => {
        e.preventDefault();
        heading.scrollIntoView({ behavior: "smooth" });
        
        // Atualiza item ativo
        document.querySelectorAll(".toc-list a").forEach(link => link.classList.remove("active"));
        a.classList.add("active");
      });

      li.appendChild(a);
      tocList.appendChild(li);
    });
  }

  // ==========================================
  // 7. Funcionalidade de Compartilhar Link
  // ==========================================
  window.copyPageLink = function() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?page=${currentPage}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      const toast = document.getElementById("toast");
      if (toast) {
        toast.textContent = "Link copiado para a área de transferência!";
        toast.style.display = "block";
        setTimeout(() => {
          toast.style.display = "none";
        }, 3000);
      }
    });
  };

  window.copyIPAddress = function() {
    navigator.clipboard.writeText("jogar.netpixelmon.com.br").then(() => {
      const toast = document.getElementById("toast");
      if (toast) {
        toast.textContent = "IP jogar.netpixelmon.com.br copiado!";
        toast.style.display = "block";
        setTimeout(() => {
          toast.style.display = "none";
        }, 3000);
      }
    });
  };

  // Base de dados de vantagens VIP
  const VIP_PERKS = {
    ultimate: {
      name: "VIP ULTIMATE (Eterno)",
      price: "R$ 500,00",
      perks: [
        "Acesso vitalício (sem mensalidades ou renovações)",
        "Comando <code>/fly</code> permanente para voar pelo mapa",
        "Kit Ultimate Diário (Pokébolas Lendárias, Doces Raros e itens de evolução)",
        "Breed sem tempo de recarga (cooldown) eterno",
        "Tag exclusiva <strong>[Ultimate]</strong> dourada com brilho no chat e no Discord",
        "Acesso à Mina VIP exclusiva e áreas de spawn exclusivas",
        "Prioridade máxima na fila de entrada quando o servidor estiver lotado"
      ]
    },
    net: {
      name: "VIP NET (60 dias)",
      price: "R$ 229,90",
      perks: [
        "Duração de 60 dias de benefícios",
        "Kit Net com chaves lendárias e itens especiais",
        "Prefixo exclusivo <strong>[Net]</strong> no chat e Discord",
        "Comando <code>/fly</code> ativo durante o período VIP",
        "Cooldown de breed reduzido para apenas 15 minutos",
        "Multiplicador de Pokecoins de 1.5x ao derrotar Pokémons selvagens"
      ]
    },
    master: {
      name: "VIP MASTER",
      price: "R$ 99,99",
      perks: [
        "Comando <code>/fly</code> para voar no spawn",
        "Kit Master Diário com Ultra Balls e chaves de caixas",
        "Cooldown de breed reduzido para 30 minutos",
        "Tag exclusiva <strong>[Master]</strong> no chat e no Discord",
        "Acesso ao mercado de jogadores (/ah) com até 15 slots simultâneos"
      ]
    },
    park: {
      name: "VIP PARK",
      price: "R$ 49,99",
      perks: [
        "Kit Park contendo Safari Balls e Park Balls adicionais",
        "Tag exclusiva <strong>[Park]</strong> no chat e Discord",
        "Spawn de montaria terrestre cosmética",
        "Cooldown de breed reduzido para 1 hora",
        "Comando <code>/heal</code> móvel a cada 10 minutos"
      ]
    },
    ultra: {
      name: "VIP ULTRA",
      price: "R$ 29,99",
      perks: [
        "Kit Ultra diário com Pokébolas e Great Balls adicionais",
        "Tag <strong>[Ultra]</strong> no chat",
        "Acesso ao comando <code>/ec</code> (Enderchest móvel)",
        "Acesso ao comando <code>/craft</code> móvel"
      ]
    },
    great: {
      name: "VIP GREAT",
      price: "R$ 9,99",
      perks: [
        "Kit Great diário básico com Pokébolas normais",
        "Tag <strong>[Great]</strong> no chat",
        "Comando <code>/nick</code> para alterar seu apelido no chat",
        "Vantagens estéticas básicas do servidor"
      ]
    }
  };

  window.showVipDetails = function(vipId) {
    const vip = VIP_PERKS[vipId];
    if (!vip) return;

    document.getElementById("modalVipName").textContent = vip.name;
    document.getElementById("modalVipPrice").textContent = vip.price;

    const perksList = document.getElementById("modalVipPerks");
    perksList.innerHTML = "";
    vip.perks.forEach(perk => {
      const li = document.createElement("li");
      li.innerHTML = perk;
      perksList.appendChild(li);
    });

    const modal = document.getElementById("vipModal");
    modal.classList.add("active");
  };

  window.closeVipModal = function() {
    const modal = document.getElementById("vipModal");
    modal.classList.remove("active");
  };

  // Fechar modal ao clicar fora
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("vipModal");
    if (e.target === modal) {
      closeVipModal();
    }
  });

  // Inicializadores
  initBreedTypes();
  initSimulator();
  switchPage("home"); // Carrega a home por padrão
});
