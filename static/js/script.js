
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname === "/diario") {
    iniciarBarraProgressoCondicional();
  }
});

function toggleAtividades(id) {
  const container = document.getElementById(id);
  const isOpen = container.classList.contains('open');
  document.querySelectorAll('.atividades-container').forEach(c => c.classList.remove('open'));
  document.querySelectorAll('.disciplina-header .arrow').forEach(a => a.textContent = '►');
  if (!isOpen) {
    container.classList.add('open');
    const arrow = container.querySelector('.disciplina-header .arrow');
    if (arrow) arrow.textContent = '▼';
  }
}

function adicionarSubtarefaLivre(idx) {
  const container = document.getElementById('subtarefas_container_' + idx);
  if (!container) return;

  // Cria o wrapper da subtarefa
  const div = document.createElement('div');
  div.classList.add('linha-subtarefa');

  // Cria o input da subtarefa
  const input = document.createElement('input');
  input.type = 'text';
  input.name = `subtarefas_${idx}_nome[]`;  
  input.placeholder = 'Descreva a atividade preliminar';
  input.classList.add('input-subtarefa');

  // Botão de remover
  const btnRemover = document.createElement('button');
  btnRemover.type = 'button';
  btnRemover.innerText = '–';
  btnRemover.classList.add('btn-remover-subtarefa');
  btnRemover.title = 'Remover linha';
  btnRemover.onclick = () => container.removeChild(div);

  // Monta
  div.appendChild(input);
  div.appendChild(btnRemover);
  container.appendChild(div);
}

function confirmarSubtarefaLinha(btn) {
  const wrapper = btn.closest('.subtarefa-item');
  const textarea = wrapper.querySelector('textarea');
  const texto = textarea.value.trim();

  if (texto) {
    wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span>${texto}</span>
        <div class="subtarefa-actions">
          <button type="button" class="btn-icon" onclick="removerSubtarefaLinha(this)">−</button>
        </div>
      </div>
      <input type="hidden" name="${textarea.name}" value="${texto}">
    `;
    wrapper.classList.add("confirmada");
  }
}

function removerSubtarefaLinha(btn) {
  const wrapper = btn.closest('.subtarefa-item');
  if (wrapper) wrapper.remove();
}


function confirmarTarefa(idx) {
  const tarefa = document.getElementById(`atividade_${idx}`);
  const btn = tarefa.querySelector(".confirmar-tarefa-circulo");
  const status = document.getElementById(`status_${idx}`);
  const progresso = document.getElementById(`progresso_${idx}`);
  const observacao = document.getElementById(`observacao_${idx}`) || { value: "" };
  const edt = tarefa?.dataset.edt || "";
  const tarefaEspecial = ["SMS", "QUALIDADE", "Gerais"].includes(edt);
  const estaConfirmada = tarefa.classList.contains("confirmada");

  if (estaConfirmada) {
    tarefa.classList.remove("confirmada");
    if (btn) {
      btn.style.backgroundColor = '#8bc34a';
      btn.style.border = 'none';
    }
    atualizarBadgeProgresso();
    return;
  }

  if (!tarefaEspecial && (!status?.value || !progresso?.value)) {
    alert('Insira um status e progresso da atividade');
    return;
  }

  tarefa.classList.add("confirmada");
  if (btn) {
    btn.style.backgroundColor = '#4caf50';
    btn.style.border = '2px solid #388e3c';
  }
  atualizarBadgeProgresso();

  removerHiddenExistentes(idx);
  gravarHidden(idx, "atividade_idx", idx);
  gravarHidden(idx, "status", status?.value || "");
  gravarHidden(idx, "progresso", progresso?.value || "");
  gravarHidden(idx, "observacoes", observacao.value);

 // 🛠️ Subtarefas
  const subtarefas = tarefa.querySelectorAll(
    `#subtarefas_container_${idx} input[name="subtarefas_${idx}_nome[]"]`
  );
  const subtarefasLista = [...subtarefas].map(el => el.value.trim()).filter(Boolean);
  console.log("Subtarefas detectadas:", subtarefasLista);
  subtarefasLista.forEach(valor => {
    gravarHidden(idx, `subtarefas_${idx}_nome`, valor);
  });

  const ferramentas = tarefa.querySelector(`#ferramentas_selecionadas_${idx}`);
  if (ferramentas) {
    [...ferramentas.selectedOptions].forEach(opt => {
      gravarHidden(idx, `ferramentas_recursos_${idx}`, opt.value);
    });
  }

  const detalheAtivo = document.querySelector('.detalhe-atividade.active');
  if (detalheAtivo) {
    detalheAtivo.classList.remove('active');
    const placeholder = detalheAtivo.parentElement.querySelector('.placeholder');
    if (placeholder) placeholder.classList.remove('hidden');
  }

  const ferramentasSelecionadas = tarefa.querySelector(`#ferramentas_selecionadas_${idx}`);
  const dataPreench = document.getElementById("filtroData")?.value || new Date().toISOString().split("T")[0];
  const recursos = [...(ferramentasSelecionadas?.selectedOptions || [])].map(opt => opt.value).join(", ");
  // # const subtarefasLista = Array.from(subtarefas).map(s => s.value);
  const usuario = document.body.dataset.email || "desconhecido@engemon.com.br";
  const unidade = tarefa.querySelector('.unidade-text')?.innerText || "";
  const disciplina = tarefa.closest(".nivel-box")?.querySelector(".disciplina-header")?.innerText.trim() || "";
  const tarefaNome = tarefa.querySelector(".tarefa-titulo")?.innerText || "";

  const dados = {
    "atividade_idx": idx,
    "EDT": edt,
    "TAREFA": tarefaNome,
    "STATUS": status?.value || "",
    "DATA DE INICIO (PROG)": tarefa.dataset.inicio || "",
    "DATA DE INICIO REAL": status?.value === "Iniciada" ? dataPreench : "",
    "DATA DE TERMINO (PROG)": tarefa.dataset.fim || "",
    "DATA DE TERMINO REAL": status?.value === "Finalizada" ? dataPreench : "",
    "PROGRESSO": progresso?.value || "",
    "Unidade de medida": unidade,
    "ENCARREGADO": tarefa.dataset.encarregado || "",
    "Disciplina": disciplina,
    "OBS": observacao?.value || "",
    "RECURSOS": recursos,
    "ATIVIDADES PRELIMINARES": subtarefasLista,
    "DATA DE PREENCHIMENTO": dataPreench,
    "USUÁRIO": usuario
  };

  fetch("/salvar_tarefa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  }).then(res => {
    if (!res.ok) {
      console.error("Erro ao salvar tarefa", dados.EDT);
    }
  });

  setTimeout(() => {
    const tarefasRestantes = [...document.querySelectorAll('.item-atividade:not(.confirmada)')];
    const proxima = tarefasRestantes.find(t => parseInt(t.id.split('_')[1]) > parseInt(idx));
    if (proxima) {
      const container = proxima.closest('.atividades-container');
      if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        const titulo = container.previousElementSibling;
        if (titulo && titulo.classList.contains('disciplina-header')) {
          titulo.querySelector('.arrow').textContent = '▼';
        }
      }
      const containerId = container.id;
      const proximoIdx = proxima.id.split('_')[1];
      mostrarDetalhes(containerId, proximoIdx);
      proxima.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 300);
}

function removerHiddenExistentes(idx) {
  const form = document.querySelector("form");
  form.querySelectorAll(`input[data-idx="${idx}"]`).forEach(e => e.remove());
}

function atualizarBadgeProgresso() {
  const total = document.querySelectorAll('.item-atividade:not(.hidden)').length;
  const preenchidas = document.querySelectorAll('.item-atividade.confirmada:not(.hidden)').length;

  const badge = document.querySelector('.progress-badge');
  const percentual = total > 0 ? Math.round((preenchidas / total) * 100) : 0;
  if (badge) {
    badge.textContent = `${preenchidas} / ${total} (${percentual}%)`;
    badge.style.backgroundImage = `linear-gradient(to right, #4A90E2 ${percentual}%, #d9534f ${percentual}% 100%)`;
  }
}

function applyFilters() {
  const encVal  = document.getElementById('filtroEncarregado').value.trim().toLowerCase();
  const dateVal = document.getElementById('filtroData').value;

  document.querySelectorAll('.item-atividade').forEach(item => {
    const eco = (item.getAttribute('data-encarregado') || '').trim().toLowerCase();
    const matchEnc = !encVal || eco === encVal;

    let matchDate = true;
    if (dateVal) {
      const periodo = item.querySelector('.periodo-tarefa')?.textContent || '';
      const [ini, fim] = periodo.split(' a ').map(s => s.trim());

      if (ini && fim) {
        const [yr, mo, dy] = dateVal.split('-');
        const dataFiltro = new Date(`${yr}-${mo}-${dy}`);
        const [dIni, mIni, yIni] = ini.split('/');
        const [dFim, mFim, yFim] = fim.split('/');

        if (dIni && mIni && yIni && dFim && mFim && yFim) {
          const dataIni = new Date(`${yIni}-${mIni}-${dIni}`);
          const dataFim = new Date(`${yFim}-${mFim}-${dFim}`);
          matchDate = dataFiltro >= dataIni && dataFiltro <= dataFim;
        } else {
          matchDate = false;
        }
      } else {
        matchDate = false;
      }
    }

    item.style.display = (matchEnc && matchDate) ? '' : 'none';
  });

  document.querySelectorAll('.nivel-box').forEach(nivel => {
    const temVisivel = Array.from(nivel.querySelectorAll('.item-atividade')).some(i => i.style.display !== 'none');
    nivel.style.display = temVisivel ? '' : 'none';
  });

  document.querySelectorAll('.atividades-container.open').forEach(c => c.classList.remove('open'));
  document.querySelectorAll('.disciplina-header .arrow').forEach(a => a.textContent = '►');
}

function iniciarBarraProgressoCondicional() {
  const bar = document.getElementById("loading-bar-fill");
  const container = document.getElementById("fake-loading-bar");
  const text = document.getElementById("loading-bar-text");

  container.style.display = "block";
  bar.style.transition = "";
  bar.style.width = "0%";
  if (text) text.textContent = "0%";

  let progresso = 0;
  const maxFake = 100;
  const fakeInterval = setInterval(() => {
    if (progresso < maxFake) {
      progresso += Math.random() * 3 + 1;
      progresso = Math.min(progresso, maxFake);
      const pct = Math.ceil(progresso);
      bar.style.width = `${pct}%`;
      if (text) text.textContent = `${pct}%`;
    } else {
      clearInterval(fakeInterval);
    }
  }, 500);

  const checkInterval = setInterval(() => {
    const item = document.querySelector('.item-atividade');
    if (item && item.offsetHeight > 0) {
      clearInterval(fakeInterval);
      clearInterval(checkInterval);
      bar.style.transition = "width 0.5s ease";
      bar.style.width = "100%";
      if (text) text.textContent = "100%";
      setTimeout(() => container.style.display = "none", 600);
    }
  }, 200);

  setTimeout(() => {
    clearInterval(fakeInterval);
    clearInterval(checkInterval);
    bar.style.transition = "width 0.5s ease";
    bar.style.width = "100%";
    if (text) text.textContent = "100%";
    setTimeout(() => container.style.display = "none", 600);
  }, 30000);
}

function mostrarDetalhes(containerId, idx) {
  document.querySelectorAll(`#detalhes_${containerId} .detalhe-atividade`).forEach(el => el.classList.remove('active'));
  document.querySelector(`#detalhes_${containerId} .placeholder`).classList.remove('hidden');

  document.querySelector(`#detalhe_${containerId}_${idx}`).classList.add('active');
  document.querySelector(`#detalhes_${containerId} .placeholder`).classList.add('hidden');

  document.getElementById('atividade_selecionada').value = idx;
}

function adicionarRecursoManual(idx) {
  const input = document.getElementById(`novo_recurso_${idx}`);
  const select = document.getElementById(`ferramentas_selecionadas_${idx}`);
  const value = input.value.trim();
  if (value) {
    const option = document.createElement("option");
    option.text = value;
    option.value = value;
    option.selected = true;
    select.add(option);
    input.value = "";
  }
}

function gravarHidden(idx, campo, valor) {
  const form = document.getElementById("diarioForm");
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = `${campo}[]`;
  input.value = valor;
  input.dataset.idx = idx;
  form.appendChild(input);
}

function toggleGrupoSub(id) {
  const el = document.getElementById(id);
  const isVisible = el.style.display === 'block';
  el.style.display = isVisible ? 'none' : 'block';
}

function exportarDiario() {
  const dateInput = document.getElementById('filtroData');
  const date = dateInput && dateInput.value;
  if (!date) {
    alert('Selecione uma data para exportar.');
    return;
  }
  window.location.href = `/exportar_diario?date=${date}`;
}

function enviarTarefaParaServidor(dados) {
  fetch("/salvar_tarefa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  }).then(res => {
    if (res.ok) {
      console.log("Tarefa salva:", dados.EDT);
    } else {
      console.error("Falha ao salvar tarefa:", dados.EDT);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('diarioForm');
  const dateInput = document.getElementById('filtroData');
  const hiddenInput = document.getElementById('fill_date_hidden');

  if (form && dateInput && hiddenInput) {
    form.addEventListener('submit', () => {
      hiddenInput.value = dateInput.value || '';
    });
  }

  if (window.location.pathname === "/diario") {
    iniciarBarraProgressoCondicional();
    document.querySelectorAll('select[id^="status_"]').forEach(sel => 
      sel.addEventListener('change', atualizarBadgeProgresso)
    );
  }
});

window.addEventListener("load", () => {
  if (window.location.pathname === "/diario") {
    iniciarBarraProgressoCondicional();
    document.querySelectorAll('select[id^="status_"]').forEach(sel => 
      sel.addEventListener('change', atualizarBadgeProgresso)
    );
  }
});
