class Grafo {
  constructor() {
    this.listaAdjacencia = {};
    this.pedagios = {};
  }

  adicionarVertice(cidade, pedagio) {
    if (!this.listaAdjacencia[cidade]) {
      this.listaAdjacencia[cidade] = [];
      this.pedagios[cidade] = pedagio;
    }
  }

  adicionarAresta(u, v, distancia) {
    this.listaAdjacencia[u].push({ destino: v, distancia });
    this.listaAdjacencia[v].push({ destino: u, distancia });
  }
}

class FilaMinima {
  constructor() {
    this.fila = [];
  }

  trocar(i, j) {
    [this.fila[i], this.fila[j]] = [this.fila[j], this.fila[i]];
  }

  inserir(item) {
    this.fila.push(item);
    this.subir(this.fila.length - 1);
  }

  subir(indice) {
    const pai = Math.floor((indice - 1) / 2);
    if (pai >= 0 && this.fila[pai].custo > this.fila[indice].custo) {
      this.trocar(pai, indice);
      this.subir(pai);
    }
  }

  remover() {
    if (!this.fila.length) return null;
    this.trocar(0, this.fila.length - 1);
    const topo = this.fila.pop();
    this.descer(0);
    return topo;
  }

  descer(indice) {
    const esquerda = 2 * indice + 1;
    const direita = 2 * indice + 2;
    let menor = indice;

    if (esquerda < this.fila.length && this.fila[esquerda].custo < this.fila[menor].custo) {
      menor = esquerda;
    }
    if (direita < this.fila.length && this.fila[direita].custo < this.fila[menor].custo) {
      menor = direita;
    }
    if (menor !== indice) {
      this.trocar(indice, menor);
      this.descer(menor);
    }
  }

  estaVazia() {
    return this.fila.length === 0;
  }
}

function carregarGrafo() {
  fetch('/json/capitais.json')
    .then(res => res.json())
    .then(dados => {
      window.grafo = new Grafo();
      
      dados.forEach(entrada => {
        const [cidade, info] = Object.entries(entrada)[0];
        grafo.adicionarVertice(cidade, info.toll);
      });
      
      dados.forEach(entrada => {
        const [cidade, info] = Object.entries(entrada)[0];
        Object.entries(info.neighbors).forEach(([vizinho, distancia]) => {
          grafo.adicionarAresta(cidade, vizinho, distancia);
        });
      });

      preencherSelects();
    })
    .catch(err => console.error('Erro ao carregar capitais.json:', err));
}

function preencherSelects() {
  const origem = document.getElementById('origem');
  const destino = document.getElementById('destino');
  Object.keys(grafo.listaAdjacencia).sort().forEach(cidade => {
    origem.add(new Option(cidade, cidade));
    destino.add(new Option(cidade, cidade));
  });
}

function dijkstra(origem, destino, precoCombustivel, autonomia) {
  const custos = {}, anteriores = {};
  const fila = new FilaMinima();

  Object.keys(grafo.listaAdjacencia).forEach(c => custos[c] = Infinity);
  custos[origem] = 0;
  fila.inserir({ cidade: origem, custo: 0 });

  while (!fila.estaVazia()) {
    const { cidade: atual, custo } = fila.remover();
    if (atual === destino) break;

    grafo.listaAdjacencia[atual].forEach(({ destino: vizinho, distancia }) => {
      const custoCombustivel = (distancia / autonomia) * precoCombustivel;
      const custoPedagio = (vizinho === destino) ? 0 : (grafo.pedagios[vizinho] || 0);
      const novoCusto = custo + custoCombustivel + custoPedagio;

      if (novoCusto < custos[vizinho]) {
        custos[vizinho] = novoCusto;
        anteriores[vizinho] = atual;
        fila.inserir({ cidade: vizinho, custo: novoCusto });
      }
    });
  }

  if (custos[destino] === Infinity) return null;
  const caminho = [];
  for (let atual = destino; atual; atual = anteriores[atual]) caminho.unshift(atual);
  return { caminho, custo: custos[destino] };
}

document.addEventListener('DOMContentLoaded', () => {
  carregarGrafo();

  document.getElementById('buscar').addEventListener('click', () => {
    const origem = document.getElementById('origem').value;
    const destino = document.getElementById('destino').value;
    const preco = parseFloat(document.getElementById('combustivel').value);
    const autonomia = parseFloat(document.getElementById('autonomia').value);

    if (!origem || !destino || isNaN(preco) || isNaN(autonomia)) {
      alert('Preencha todos os campos!');
      return;
    }

    const resultado = dijkstra(origem, destino, preco, autonomia);
    document.getElementById('caminho').textContent = resultado ? resultado.caminho.join(' → ') : 'Rota inexistente';
    document.getElementById('custo').textContent = resultado ? resultado.custo.toFixed(2) : '0.00';
  });

  document.getElementById('limpar').addEventListener('click', () => {
    document.getElementById('caminho').textContent = '---';
    document.getElementById('custo').textContent = '0.00';
  });
});
